import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'virtual:uno.css'
import App from './App.vue'
import router from './router'
import './style.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
setActivePinia(pinia)

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia).use(router).use(ElementPlus, { locale: zhCn })
router.isReady().then(() => app.mount('#app'))
