import http from './index'

export const login = (data) => http.post('/api/auth/login', data)
export const logout = () => http.post('/api/auth/logout')
