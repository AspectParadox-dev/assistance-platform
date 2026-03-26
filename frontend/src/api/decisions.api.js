import client from './axiosClient';

export const listDecisions = (applicationId) => client.get(`/applications/${applicationId}/decisions`).then(r => r.data);
export const createDecision = (applicationId, data) => client.post(`/applications/${applicationId}/decisions`, data).then(r => r.data);
