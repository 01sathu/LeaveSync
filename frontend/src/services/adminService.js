import { request } from './api';

export const getDashboardStats = async () => {
  return request('/admin/dashboard');
};

export const getAllEmployees = async () => {
  return request('/admin/employees');
};

export const getAllLeaves = async (status = '') => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/admin/leaves${query}`);
};

export const getLeaveDetail = async (id) => {
  return request(`/admin/leaves/${id}`);
};

export const approveLeave = async (id) => {
  return request(`/admin/leaves/${id}/approve`, {
    method: 'PATCH',
  });
};

export const rejectLeave = async (id, rejectionReason = '') => {
  return request(`/admin/leaves/${id}/reject`, {
    method: 'PATCH',
    body: { rejectionReason },
  });
};
