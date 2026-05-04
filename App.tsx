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
import { LinearGradient } from "expo-linear-gradient"; 
import { ColorValue } from "react-native"; 

//hava durumu tutan tip
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
  const [city, setCity] = useState<string>("Istanbul");  //uygulama açılırken default olarak ıstanbul verısını getirir
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const[favorites, setFavorites] = useState<string[]>([]);
  const [selectedForecast, setSelectedForecast] =useState<ForecastItem | null>(null);

  const activeWeather: any = selectedForecast || weather; //gunluk tahmın seçildiyse onu gösterir yoksa  güncel hava durumunu gösterir

  //hava durumuna gore background color değiş
const getBackgroundGradient = (main?: string): readonly [ColorValue, ColorValue] =>{
  switch (main) {
    case "Clear": 
      return [ "#B3E5FC", "#4FC3F7"];

    case "Clouds":     
      return ["#ECEFF1", "#90A4AE"];

    case "Rain": 
      return ["#4FC3F7", "#01579B"];

    case "Snow": 
      return ["#E1F5FE", "#B3E5FC"];

    case "Thunderstorm": 
      return ["#616161", "#263238"];

    default:
      return ["#B3E5FC", "#81D4FA"];
  }
};

  //hava durumuna uygun ikon
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

//fav sehrı yükle
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
      setSelectedForecast(null);

      const res2 = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${targetCity}&appid=${API_KEY}&units=metric&lang=tr`
      );

      const data2 = await res2.json();

 //openweatherappten gelen beş günlük tahmin verisi
const todayStr = new Date().toDateString();


let daily: ForecastItem[] = data2.list.filter(
  (item: ForecastItem) => item.dt_txt.includes("12:00:00")
);

const hasToday12 = daily.some(
  (item) =>
    new Date(item.dt_txt).toDateString() === todayStr
);


if (!hasToday12) {
  const todayItem = data2.list.find(
    (item: ForecastItem) =>
      new Date(item.dt_txt).toDateString() === todayStr
  );

  if (todayItem) {
    daily = [todayItem, ...daily];
  }
}

setForecast(daily);

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

//diğer gunlerin tahminlerini gösterme
const isToday =(dt_txt: string) =>{
    if (!dt_txt) return false;

  const today = new Date().toDateString();
  const itemDate = new Date(dt_txt).toDateString();

  return today === itemDate;
}


  //UI
return (
  <LinearGradient
    colors={getBackgroundGradient(activeWeather?.weather?.[0]?.main)}
    style={{ flex: 1, padding: 20 }}
  >
    {loading && (
      <ActivityIndicator size="large" style={{ marginTop: 20 }} />
    )}

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

    {/* ANA WEATHER ALANI */}
    {activeWeather && weather && (
      <View style={{ alignItems: "center", marginTop: 20 }}>

        {/* GÜN ETİKETİ */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12 }}>
            {selectedForecast
              ? new Date(selectedForecast.dt_txt).toLocaleDateString("tr-TR", {
                  weekday: "long",
                })
              : "Bugün"}
          </Text>
        </View>

        {/* ŞEHİR */}
        <Text style={{ fontSize: 24 }}>{weather.name}</Text>

        {/* ICON */}
        <Text style={{ fontSize: 50 }}>
          {getWeatherEmoji(activeWeather.weather[0].main)}
        </Text>

        {/* SICAKLIK */}
        <Text style={{ fontSize: 32 }}>
          {Math.round(activeWeather.main.temp)}°C
        </Text>

        <Text>{activeWeather.weather[0].description}</Text>

        {/* DETAY */}
        <View style={{ marginTop: 15 }}>
          <Text>
            Hissedilen: {Math.round(activeWeather.main.feels_like ?? 0)}°C
          </Text>
          <Text>Nem: %{activeWeather.main.humidity ?? "-"}</Text>
          <Text>Basınç: {activeWeather.main.pressure ?? "-"} hPa</Text>

          {/* SADECE WEATHER'DA VAR */}
          {"wind" in activeWeather && (
            <Text>Rüzgar: {activeWeather.wind.speed} m/s</Text>
          )}
        </View>
      </View>
    )}

    {/* FAVORİLER */}
    <View>
      <Text style={{ marginTop: 20, fontSize: 18, fontWeight: "bold" }}>
        Favori Şehirler
      </Text>

      <FlatList
        data={favorites}
        horizontal
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
                elevation: 3,
              }}
            >
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
                <Text style={{ color: "red", fontSize: 12 }}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => getWeather(item)}>
                <Text>{item}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>

    {/* FORECAST */}
    <FlatList
      data={forecast}
      keyExtractor={(item) => item.dt.toString()}
      showsHorizontalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      style={{ marginTop: 20 }}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setSelectedForecast(item)}>
          <View
            style={{
              marginRight: 15,
              margin: 10,
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.5)",
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
        </TouchableOpacity>
      )}
    />
  </LinearGradient>
);
}