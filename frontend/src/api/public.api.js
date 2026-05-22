import axiosClient from './axiosClient';

export async function getOrgBySlug(orgSlug) {
  const { data } = await axiosClient.get(`/public/org/${orgSlug}`);
  return data;
}

export async function getOrgForm(orgSlug) {
  const { data } = await axiosClient.get(`/public/org/${orgSlug}/form`);
  return data;
}

export async function checkApplicationStatus(orgSlug, referenceNumber, email) {
  const { data } = await axiosClient.post('/public/status', { orgSlug, referenceNumber, email });
  return data;
}
