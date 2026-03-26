import client from './axiosClient';

export const listDonations = (params) => client.get('/donations', { params }).then(r => r.data);
export const createDonation = (data) => client.post('/donations', data).then(r => r.data);
export const importDonationsCsv = (formData) =>
  client.post('/donations/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const updateDonation = (id, data) => client.patch(`/donations/${id}`, data).then(r => r.data);
export const deleteDonation = (id) => client.delete(`/donations/${id}`);
