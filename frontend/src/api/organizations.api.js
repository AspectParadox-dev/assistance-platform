import client from './axiosClient';

export const getMyOrg = () => client.get('/organizations/me').then(r => r.data);
export const updateMyOrg = (data) => client.patch('/organizations/me', data).then(r => r.data);
