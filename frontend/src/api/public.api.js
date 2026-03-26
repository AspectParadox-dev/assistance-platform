import axiosClient from './axiosClient';

/**
 * Check application status without authentication.
 * @param {string} referenceNumber  e.g. "APP-2026-00001"
 * @param {string} email            Must match the email on the application
 */
export async function checkApplicationStatus(referenceNumber, email) {
  const { data } = await axiosClient.post('/public/status', { referenceNumber, email });
  return data;
}
