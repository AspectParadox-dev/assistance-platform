import client from './axiosClient';

export const listFormFields = () => client.get('/form-fields').then(r => r.data);
export const createFormField = (data) => client.post('/form-fields', data).then(r => r.data);
export const updateFormField = (id, data) => client.put(`/form-fields/${id}`, data).then(r => r.data);
export const deleteFormField = (id) => client.delete(`/form-fields/${id}`);
export const reorderFormFields = (items) => client.patch('/form-fields/reorder', { items });
