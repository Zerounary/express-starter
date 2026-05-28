import axios from 'axios'
import { API_BASE } from '../config'

export function createPublicQuizClient(token) {
  const client = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (res) => {
      const data = res.data
      if (data.code !== undefined && data.code !== 0) {
        return Promise.reject(new Error(data.message || '请求失败'))
      }
      return data
    },
    (err) => Promise.reject(new Error(err.response?.data?.message || err.message || '网络异常')),
  )

  return {
    getActivity: () => client.get('/api/quiz/public/activity'),
    checkStudentNo: (data) => client.post('/api/quiz/public/check-student-no', data),
    login: (data) => client.post('/api/quiz/public/login', data),
    submitProgress: (data) => client.post('/api/quiz/public/progress', data),
    getResult: (participantId) => client.get(`/api/quiz/public/result/${participantId}`),
  }
}
