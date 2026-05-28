import http from './index'

export const listStudentNos = (params) => http.get('/api/student-nos', { params })
export const getStudentNo = (id) => http.get(`/api/student-nos/${id}`)
export const createStudentNo = (data) => http.post('/api/student-nos', data)
export const updateStudentNo = (id, data) => http.put(`/api/student-nos/${id}`, data)
export const deleteStudentNo = (id) => http.delete(`/api/student-nos/${id}`)
export const importStudentNos = (data) => http.post('/api/student-nos/import', data)
