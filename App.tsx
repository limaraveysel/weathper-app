import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Alert} from "react-native";

//hava durumu tutan tıp
type WeatherType = {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind:{
    speed:number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
};

//gunluk tahmin tip
type ForecastItem = {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
  };
  weather: {
    main: string;
    icon: string;
  }[];
};

const API_KEY = "e89544cef341bdb1e99a39e4d3ec19da"; //openweathermap api anahtarı

export default function App() {
  const [city, setCity] = useState<string>("Istanbul");  //uyg. açılırken ıstanbul verısını getirir
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const[favorites, setFavorites] = useState<string[]>([]);

  //hava durumuna gore background color değıs
const getBackgroundColor = (main?: string): string => {
  switch (main) {
    case "Clear":         
      return "#87CEEB";   

    case "Clouds":        
      return "#90A4AE"; 

    case "Rain":          
      return "#778899";  

    case "Snow":         
      return "#E1F5FE";   

    case "Thunderstorm":  
      return "#708090";  

    default:           
      return "#B3E5FC";  
  }
};

  //hava durumuna uygun ıkon
const getWeatherEmoji = (main?: string) => {
  switch (main) {
    case "Clear":
      return "☀️";
    case "Clouds":
      return "☁️";
    case "Rain":
      return "🌧️";
    case "Snow":
      return "❄️";
    case "Thunderstorm":
      return "⛈️";
    default:
      return "🌤️";
  }
};

//favorı sehır ekleme
const addFavorites = () => {
  const trimmedCity = city.trim();

  if (trimmedCity === "") return;

  if (!favorites.includes(trimmedCity)) {
    const updated = [...favorites, trimmedCity];
    setFavorites(updated);
    saveFavorites(updated);
  }
};

//fav sehrı kaydetme
const saveFavorites = async (list: string[]) => {
  try {
    await AsyncStorage.setItem("favorites", JSON.stringify(list));
  } catch (e) {
    console.log("Kaydetme hatası:", e);
  }
};

//fav sehrı ekle kaydet
const loadFavorites = async () => {
  try {
    const data = await AsyncStorage.getItem("favorites");

    if (data !== null) {
      const parsed = JSON.parse(data);

      if (Array.isArray(parsed)) {
        setFavorites(parsed);
      } else {
        setFavorites([]);
      }
    }
  } catch (e) {
    console.log("Favoriler yüklenemedi:", e);
  }
};

useEffect(() => {
  const init = async () => {
    await loadFavorites();
  };
  init();
}, []);

//favori şehri isteğe bağlı silme
const removeFavorite = (cityToRemove: string) => {
  Alert.alert(
    "Favoriyi Kaldır",
    `${cityToRemove} favorilerden kaldırılsın mı?`,
    [
      { text: "İptal", style: "cancel" },
      {
        text: "Kaldır",
        style: "destructive",
        onPress: () => {
          const updated = favorites.filter((item) => item !== cityToRemove);
          setFavorites(updated);
          saveFavorites(updated);
        },
      },
    ]
  );
};

//hava durumu getırme
  const getWeather = async (cityName?: string) => {
    const targetCity= cityName || city;
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${targetCity}&appid=${API_KEY}&units=metric&lang=tr`
      );

      const data: WeatherType = await res.json();

      if (!res.ok) {
        throw new Error("Şehir bulunamadı");
      }

      setWeather(data);

      const res2 = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${targetCity}&appid=${API_KEY}&units=metric&lang=tr`
      );

      const data2 = await res2.json();

      const daily: ForecastItem[] = data2.list.filter(
        (item: ForecastItem) => item.dt_txt.includes("12:00:00") //gunluk tahmın ıcın saat 12de olanları alır
      );

//gunluk tahmınler
      setForecast(daily);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getWeather();
  }, []);

  {loading && (
  <ActivityIndicator size="large" style={{ marginTop: 20 }} />
)}



  //UI
  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: getBackgroundColor(weather?.weather?.[0]?.main),
      }}
    >
      <TextInput
        placeholder="Şehir giriniz..."
        value={city}
        onChangeText={setCity}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 10,
          borderRadius: 8,
          backgroundColor: "#fff",
        }}
      />

<View style={{ flexDirection: "row", marginTop: 10 }}>
  <View style={{ flex: 1, marginRight: 5 }}>
    <Button title="Şehri Getir" onPress={() => getWeather()} />
  </View>

  <View style={{ flex: 1, marginLeft: 5 }}>
    <Button title="Favorilere Ekle" onPress={addFavorites} />
  </View>
</View>

      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      {weather && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={{ fontSize: 24 }}>{weather.name}</Text>

<Text style={{ fontSize: 50 }}>
  {getWeatherEmoji(weather.weather[0].main)}
</Text>

          <Text style={{ fontSize: 32 }}>
            {Math.round(weather.main.temp)}°C
          </Text>

          <Text>{weather.weather[0].description}</Text>
          <View style={{ marginTop: 15 }}>
             <Text>Hissedilen: {Math.round(weather.main.feels_like)}°C</Text>
             <Text>Nem: %{weather.main.humidity}</Text>
             <Text> Basınç: {weather.main.pressure} hPa</Text>
             <Text> Rüzgar: {weather.wind.speed} m/s</Text>
           </View>
        </View>
      )}

{/*fav sehirler*/}
<View>
<Text style={{marginTop:20, fontSize:18, fontWeight:"bold"}}>Favori Şehirler</Text>

<FlatList
  data={favorites}
  extraData={favorites}
  horizontal
  showsHorizontalScrollIndicator={false}
  keyExtractor={(item, index) => index.toString()}
  contentContainerStyle={{ paddingVertical: 10 }}
  renderItem={({ item }) => (
   <View style={{ marginRight: 10 }}>
  <View
    style={{
      backgroundColor: "#ffffff",
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 18,
      minWidth: 80,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}
  >
    {}
    <TouchableOpacity
      onPress={() => removeFavorite(item)}
      style={{
        position: "absolute",
        top: -6,
        right: -6,

        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#f2f2f2",

        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "red", fontSize: 12, fontWeight: "bold" }}>
        ✕
      </Text>
    </TouchableOpacity>

    {}
    <TouchableOpacity onPress={() => getWeather(item)}>
      <Text style={{ color: "#000", fontSize: 14 }}>
        {item}
      </Text>
    </TouchableOpacity>
  </View>
</View>
  )}
/>
</View>

{/*dier gunlerin hava durumu tahminleri*/}
      <FlatList
        data={forecast}
        keyExtractor={(item) => item.dt.toString()}
       showsHorizontalScrollIndicator={false}
       ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View
            style={{
              marginRight: 15,
              margin: 10,
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              padding: 10,
              borderRadius: 10,
            }}
          >
            <Text>
              {new Date(item.dt_txt).toLocaleDateString("tr-TR", {
                weekday: "short",
              })}
            </Text>

  <Text style={{ fontSize: 24 }}>
  {getWeatherEmoji(item.weather[0].main)}
</Text>

            <Text>{Math.round(item.main.temp)}°C</Text>
          </View>
        )}
      />
    </View>
  );
}