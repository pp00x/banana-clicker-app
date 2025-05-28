import axios from './apiClient';
import { User } from '../contexts/AuthContext';

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  avatarUrl?: string;
}

export const authService = {
  async registerUser(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      // The apiClient's response interceptor should have already processed the error
      // and put the specific backend message (if any) into error.message.
      throw new Error(error.message || 'Registration failed. Please check your input and try again.');
    }
  },
  
  async loginUser(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      // The apiClient's response interceptor should have already processed the error.
      // Specific messages like "Invalid credentials" or "Your account is blocked..."
      // should be in error.message if sent by the backend and processed by apiClient.
      throw new Error(error.message || 'Login failed. Please check your credentials and try again.');
    }
  }
};