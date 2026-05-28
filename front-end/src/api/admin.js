import http from './index'

export const createTrial = (data) => http.post('/api/admin/trial', data)
