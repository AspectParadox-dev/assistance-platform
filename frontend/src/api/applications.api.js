import client from './axiosClient';

export const createApplication = (orgSlug, data) => client.post('/applications', { ...data, orgSlug }).then(r => r.data);
export const listApplications = (params) => client.get('/applications', { params }).then(r => r.data);
export const getApplication = (id) => client.get(`/applications/${id}`).then(r => r.data);
export const updateStatus = (id, status) => client.patch(`/applications/${id}/status`, { status }).then(r => r.data);
export const assignApplication = (id, caseManagerId) => client.patch(`/applications/${id}/assign`, { caseManagerId }).then(r => r.data);
export const updateCompliance = (id, checklistData) => client.patch(`/applications/${id}/compliance`, { checklistData }).then(r => r.data);
