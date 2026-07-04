import {createPinia} from 'pinia'
import {vTooltip} from 'tweeq'
import {createApp} from 'vue'

import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
// Tweeq's balloon tooltip, used via v-tooltip inside its input components.
app.directive('tooltip', vTooltip)
app.mount('#app')
