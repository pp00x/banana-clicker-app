import { createContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'player' | 'admin';
  bananaCount: number;
  isBlocked: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>; // Changed to return User
  register: (userData: RegisterData) => Promise<void>; // Assuming register might also benefit from returning User, but focusing on login for now
  logout: () => void;
  updateUserBananaCount: (count: number) => void;
  clearError: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  avatarUrl?: string;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => { throw new Error('Login function not implemented'); }, // Placeholder for default context
  register: async () => {},
  logout: () => {},
  updateUserBananaCount: () => {},
  clearError: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          try {
            const userData: User = JSON.parse(storedUser);
            setUser(userData);
            setToken(storedToken);
            setIsAuthenticated(true);
          } catch (parseError) {
            // If user data in localStorage is corrupted
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.error('Failed to parse stored user data:', parseError);
          }
        }
      } catch (err) {
        // This catch block might not be strictly necessary anymore for this specific logic
        // but kept for any other unexpected errors during initial load.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.error('Error during initial auth load:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string): Promise<User> => { // Ensure Promise<User>
    try {
      setLoading(true);
      setError(null);
      
      const { user: userData, token: authToken } = await authService.loginUser(email, password);
      
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setToken(authToken);
      setIsAuthenticated(true);
      return userData; // Return the user data
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      throw err; // Re-throw to be caught by LoginPage
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { user: newUser, token: authToken } = await authService.registerUser(userData);
      
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(newUser)); // Store user object
      setUser(newUser);
      setToken(authToken);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Remove stored user object
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const updateUserBananaCount = (count: number) => {
    if (user) {
      setUser({
        ...user,
        bananaCount: count,
      });
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        updateUserBananaCount,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};