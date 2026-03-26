import client from './axiosClient';

export const listDocuments = (applicationId) => client.get(`/applications/${applicationId}/documents`).then(r => r.data);
export const uploadDocuments = (applicationId, formData) =>
  client.post(`/applications/${applicationId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const downloadDocument = (applicationId, docId) =>
  client.get(`/applications/${applicationId}/documents/${docId}`, { responseType: 'blob' }).then(r => r.data);
export const deleteDocument = (applicationId, docId) => client.delete(`/applications/${applicationId}/documents/${docId}`);
