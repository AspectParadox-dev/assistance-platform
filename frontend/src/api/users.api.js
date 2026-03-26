import client from './axiosClient';

export const listUsers = () => client.get('/users').then(r => r.data);
export const createUser = (data) => client.post('/users', data).then(r => r.data);
export const updateUser = (id, data) => client.patch(`/users/${id}`, data).then(r => r.data);
export const deactivateUser = (id) => client.patch(`/users/${id}/deactivate`).then(r => r.data);
