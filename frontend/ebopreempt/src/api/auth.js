import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const login = async (username, password) => {
  const response = await axios.post(`${API_BASE_URL}/token/`, {
    username,
    password,
  });
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const register = async (username, email, password, confirmPassword) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register/`, {
    username,
    email,
    password,
    confirm_password: confirmPassword,
  });
  return response.data;
};
