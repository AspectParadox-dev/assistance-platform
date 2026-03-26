import client from './axiosClient';

export const listDisbursements = (params) => client.get('/disbursements', { params }).then(r => r.data);
export const getDisbursement = (id) => client.get(`/disbursements/${id}`).then(r => r.data);
export const createDisbursement = (applicationId, data) => client.post(`/applications/${applicationId}/disbursements`, data).then(r => r.data);
export const updateDisbursement = (id, data) => client.patch(`/disbursements/${id}`, data).then(r => r.data);
