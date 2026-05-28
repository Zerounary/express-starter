import axios from 'axios'
import { API_BASE } from '../config'
import { useUserStore } from '../stores/user'

const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) config.headers.Authorization = `Bearer ${userStore.token}`
  return config
})

http.interceptors.response.use(
  (res) => {
    const data = res.data
    // 后端返回格式: { code: 0, data } 或 { code, error }
    if (data.code !== undefined && data.code !== 0) {
      return Promise.reject(new Error(data.error || '请求失败'))
    }
    return data
  },
  (err) => {
    // 如果当前在登录页面，不处理 401 重定向，让登录页面自己处理错误提示
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      try {
        const userStore = useUserStore()
        userStore.$reset()
      } catch {}

      const path = window.location.pathname || '/'
      const isMobile = path.startsWith('/mobile')
      const loginPath = isMobile ? '/mobile/login' : '/login'

      const redirect = window.location.pathname + window.location.search + window.location.hash
      const target = `${loginPath}?redirect=${encodeURIComponent(redirect)}`
      window.location.href = target
    }
    // 后端错误响应格式: { code, error }
    const msg = err.response?.data?.error || err.message || '网络异常'
    return Promise.reject(new Error(msg))
  },
)

export default http
