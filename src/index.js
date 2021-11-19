
//add base scss for the site
import "./scss/index.scss";
import { createApp } from 'vue/dist/vue.esm-bundler.js';
import components from 'VueComponents.js';
const app = createApp({ components });
app.mount('#app');