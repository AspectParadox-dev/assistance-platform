import client from './axiosClient';

export const listNotes = (applicationId) => client.get(`/applications/${applicationId}/notes`).then(r => r.data);
export const createNote = (applicationId, data) => client.post(`/applications/${applicationId}/notes`, data).then(r => r.data);
