import { request } from './api';

export const applyLeave = async (leaveData) => {
  return request('/leaves', {
    method: 'POST',
    body: leaveData,
  });
};

export const getMyLeaves = async (status = '') => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/leaves/my${query}`);
};

export const getLeaveById = async (id) => {
  return request(`/leaves/${id}`);
};
