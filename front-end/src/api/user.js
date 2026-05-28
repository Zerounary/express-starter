import http from './index'

export const listUsers = (params) => http.get('/api/users', { params })
export const getUser = (id) => http.get(`/api/users/${id}`)
export const createUser = (data) => http.post('/api/users', data)
export const updateUser = (id, data) => http.put(`/api/users/${id}`, data)
export const deleteUser = (id) => http.delete(`/api/users/${id}`)
