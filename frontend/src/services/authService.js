import { request } from './api';

export const login = async (email, password) => {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
};

export const getStoredToken = () => {
  return localStorage.getItem('token');
};

export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (err) {
    return null;
  }
};

export const setSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
