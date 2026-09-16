const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Reusable HTTP request client with authorization header injection
 * and standard error parsing.
 */
export const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (networkError) {
    const error = new Error('Unable to connect to the server. Please check your network or ensure the backend server is running.');
    error.status = 0;
    error.errorCode = 'NETWORK_ERROR';
    throw error;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // If token expired or unauthorized, trigger session expiration
    if (response.status === 401 && token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const errorMessage = data?.message || 'Something went wrong. Please try again.';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.errorCode = data?.error || 'UNKNOWN_ERROR';
    error.data = data;
    throw error;
  }

  return data;
};

export default request;
