import client from './axiosClient';

export const login = (email, password) => client.post('/auth/login', { email, password }).then(r => r.data);
export const getMe = () => client.get('/auth/me').then(r => r.data);
export const googleLogin = (credential) => client.post('/auth/google', { credential }).then(r => r.data);
export const verifyEmail = (token) => client.get(`/auth/verify-email/${token}`).then(r => r.data);
export const resendVerification = (email) => client.post('/auth/resend-verification', { email }).then(r => r.data);
