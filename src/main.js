import {createVuestic} from 'vuestic-ui'
import 'vuestic-ui/styles/essential.css';
import 'vuestic-ui/styles/typography.css';
import './assets/main.css'
import {QueryClient, VueQueryPlugin} from '@tanstack/vue-query'
import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import axiosConfig from './configs/axiosConfig';
import {getCurrentUser} from './services/authService';
import money from 'v-money3'

axiosConfig()
getCurrentUser().then()
const app = createApp(App)
app.use(money, {precision: 0})
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
})
app.use(VueQueryPlugin, {queryClient})
app.use(createVuestic())
app.use(router)

app.mount('#app')
