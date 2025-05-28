import apiClient from './apiClient';
import { User } from '../contexts/AuthContext';

interface UserResponse {
  message: string;
  user: User;
}

interface UsersListResponse {
  message: string;
  count: number;
  users: User[];
}

export const userService = {
  async getAllUsers(): Promise<UsersListResponse> {
    try {
      
      const response = await apiClient.get<UsersListResponse>('/users');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },
  
  async createUser(userData: Partial<User>): Promise<UserResponse> {
    try {
      const response = await apiClient.post<UserResponse>('/users', userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create user');
    }
  },
  
  async updateUser(userId: string, userData: Partial<User>): Promise<UserResponse> {
    try {
      const response = await apiClient.put<UserResponse>(`/users/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw new Error('Failed to update user');
    }
  },
  
  async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Cannot delete admin users');
      }
      throw new Error('Failed to delete user');
    }
  },
  
  async blockUser(userId: string): Promise<UserResponse> {
    try {
      const response = await apiClient.put<UserResponse>(`/users/${userId}/block`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Cannot block admin users');
      }
      throw new Error('Failed to block user');
    }
  },
  
  async unblockUser(userId: string): Promise<UserResponse> {
    try {
      const response = await apiClient.put<UserResponse>(`/users/${userId}/unblock`);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to unblock user');
    }
  },
};