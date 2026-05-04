import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
//const API_KEY = "e89544cef341bdb1e99a39e4d3ec19da";
registerRootComponent(App);
