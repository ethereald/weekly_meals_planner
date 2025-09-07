// Client-side authentication utilities

export interface User {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ProfileResponse {
  user: User;
  settings: Record<string, unknown> | null;
}

export interface UserSettings {
  enabledMealCategories: string[];
  weeklyMealGoal?: number;
  servingSize?: number;
  budgetRange?: number;
  shoppingDay?: string;
  notificationsEnabled?: boolean;
  dietaryRestrictions?: string;
  preferredMealTimes?: string;
}

// API base URL
const API_BASE = '/api/auth';

// Auth API functions
export const authApi = {
  // Register new user
  register: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data;
  },

  // Login user
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Password change failed');
    }
  },

  // Get user profile
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await fetch(`${API_BASE}/profile`, {
      credentials: 'include', // Include cookies
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get profile');
    }

    return data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    const response = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  },

  // Check if user is authenticated (server-side check)
  checkAuth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // Get user settings
  getUserSettings: async (): Promise<UserSettings> => {
    const response = await fetch('/api/user/settings', {
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user settings');
    }

    return data;
  },
};
