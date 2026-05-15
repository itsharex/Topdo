import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import QuickCapture from './capture/QuickCapture.vue';
import MenuBarPanel from './menubar/MenuBarPanel.vue';
import './styles/main.css';

const windowKind = new URLSearchParams(window.location.search).get('window');
const Root = windowKind === 'menubar' ? MenuBarPanel : windowKind === 'capture' ? QuickCapture : App;
const app = createApp(Root);

app.use(createPinia());
app.mount('#app');
