import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Import Vant UI components
import { 
  Button, 
  Calendar, 
  Popup, 
  RadioGroup, 
  Radio, 
  Toast 
} from 'vant';

// Import Vant CSS
import 'vant/lib/index.css';

// Create Vue app
const app = createApp(App)

// Register Vant components
app.use(Button)
app.use(Calendar)
app.use(Popup)
app.use(RadioGroup)
app.use(Radio)
app.use(Toast)

// Mount the app
app.mount('#app')
