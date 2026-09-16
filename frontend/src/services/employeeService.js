import { request } from './api';

export const getProfile = async () => {
  return request('/employee/profile');
};

export const getLeaveBalance = async () => {
  return request('/employee/leave-balance');
};
