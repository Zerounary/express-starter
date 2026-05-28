import http from './index'

export const listQuizBanks = (params) => http.get('/api/quiz/banks', { params })
export const getQuizBank = (id) => http.get(`/api/quiz/banks/${id}`)
export const createQuizBank = (data) => http.post('/api/quiz/banks', data)
export const updateQuizBank = (id, data) => http.put(`/api/quiz/banks/${id}`, data)
export const deleteQuizBank = (id) => http.delete(`/api/quiz/banks/${id}`)

export const listQuizQuestions = (params) => http.get('/api/quiz/questions', { params })
export const getQuizQuestion = (id) => http.get(`/api/quiz/questions/${id}`)
export const createQuizQuestion = (data) => http.post('/api/quiz/questions', data)
export const updateQuizQuestion = (id, data) => http.put(`/api/quiz/questions/${id}`, data)
export const deleteQuizQuestion = (id) => http.delete(`/api/quiz/questions/${id}`)
export const importQuizQuestions = (data) => http.post('/api/quiz/questions/import', data)

export const listQuizActivities = (params) => http.get('/api/quiz/activities', { params })
export const getQuizActivity = (id) => http.get(`/api/quiz/activities/${id}`)
export const createQuizActivity = (data) => http.post('/api/quiz/activities', data)
export const updateQuizActivity = (id, data) => http.put(`/api/quiz/activities/${id}`, data)
export const deleteQuizActivity = (id) => http.delete(`/api/quiz/activities/${id}`)
export const getQuizActivityStats = (id, params) => http.get(`/api/quiz/activities/${id}/stats`, { params })
