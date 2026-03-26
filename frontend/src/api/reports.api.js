import client from './axiosClient';

export const getSummary = () => client.get('/reports/summary').then(r => r.data);
export const getReconciliation = (params) => client.get('/reports/reconciliation', { params }).then(r => r.data);
export const getApplicationStats = (params) => client.get('/reports/applications', { params }).then(r => r.data);
