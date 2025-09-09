'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { getUserAvatarGradient } from '@/lib/utils/userColors';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { AdminSetupForm } from '@/components/auth/AdminSetupForm';
import { authApi } from '@/lib/auth-client';

interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

const themes: { value: Theme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Clean and bright default theme' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes dark theme' },
  { value: 'ocean', label: 'Ocean', description: 'Calming blue ocean theme' },
  { value: 'forest', label: 'Forest', description: 'Natural green forest theme' },
  { value: 'sunset', label: 'Sunset', description: 'Warm orange sunset theme' },
  { value: 'pink', label: 'Pink', description: 'Soft and elegant pink theme' },
];

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Auth-related state
  const [isAuthenticatedLocal, setIsAuthenticatedLocal] = useState(false);
  const [localUser, setLocalUser] = useState<{
    id: string;
    username: string;
    createdAt: string;
    updatedAt?: string;
  } | null>(null);
  const [hasUsers, setHasUsers] = useState(true);
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Profile-related state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authApi.checkAuth();
        if (isAuth) {
          const profile = await authApi.getProfile();
          setLocalUser(profile.user);
          setIsAuthenticatedLocal(true);
          setHasUsers(true);
          fetchUserProfile();
        } else {
          setIsAuthenticatedLocal(false);
          
          // Check if any users exist in the database
          try {
            const response = await fetch('/api/auth/check-users');
            if (response.ok) {
              const data = await response.json();
              setHasUsers(data.hasUsers);
            }
          } catch (error) {
            console.error('Failed to check users:', error);
            setHasUsers(true);
          }
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
        setIsAuthenticatedLocal(false);
      }
      setCheckingUsers(false);
    };

    checkAuth();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUserProfile(data.user);
      setDisplayName(data.user.displayName || data.user.username);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile information');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          displayName: displayName.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update display name');
      }

      const data = await response.json();
      setUserProfile(data.user);
      setSuccess('Display name updated successfully');
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update display name');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(userProfile?.displayName || userProfile?.username || '');
    setIsEditing(false);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setIsAuthenticatedLocal(false);
      setLocalUser(null);
      setUserProfile(null);
      setShowChangePassword(false);
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAdminSetupSuccess = () => {
    window.location.href = '/';
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setSuccess('Theme updated successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Show loading while checking authentication
  if (checkingUsers || (isAuthenticatedLocal && isLoadingProfile)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show admin setup if no users exist
  if (!isAuthenticatedLocal && !hasUsers) {
    return <AdminSetupForm onSuccess={handleAdminSetupSuccess} />;
  }

  // Show login/register form if not authenticated
  if (!isAuthenticatedLocal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Weekly Meals Planner
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Plan your meals, track nutrition, and simplify your cooking routine
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <AuthWrapper onSuccess={() => window.location.reload()} />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Start your journey to better meal planning today
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account & Settings</h1>
          <p className="text-gray-600">Manage your profile, preferences, and theme</p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Avatar and Basic Info */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getUserAvatarGradient((userProfile || localUser)?.username || '')}`}>
                  <span className="text-white font-semibold text-xl">
                    {((userProfile?.displayName || userProfile?.username || localUser?.username) || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {userProfile?.displayName || userProfile?.username || localUser?.username}
                  </h3>
                  <p className="text-gray-600 capitalize">
                    {userProfile?.role || 'user'}
                    {isAdmin && ' • Admin Access'}
                  </p>
                </div>
              </div>

              {/* Username (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                  {userProfile?.username || localUser?.username}
                </div>
                <p className="text-xs text-gray-500 mt-1">Your username cannot be changed</p>
              </div>

              {/* Display Name */}
              {userProfile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  {isEditing ? (
                    <form onSubmit={handleUpdateDisplayName} className="space-y-3">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your display name"
                        maxLength={255}
                      />
                      <p className="text-xs text-gray-500">
                        This is how your name will appear to other users. Leave blank to use your username.
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 flex-1 mr-3">
                        {userProfile.displayName || userProfile.username}
                        {!userProfile.displayName && (
                          <span className="text-gray-500 ml-2">(using username)</span>
                        )}
                      </div>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Theme Preferences</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((themeOption) => (
                  <div
                    key={themeOption.value}
                    className={`relative rounded-lg border-2 cursor-pointer transition-all p-4 ${
                      theme === themeOption.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleThemeChange(themeOption.value)}
                  >
                    {/* Theme preview */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="theme"
                          value={themeOption.value}
                          checked={theme === themeOption.value}
                          onChange={() => handleThemeChange(themeOption.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <label className="block text-sm font-medium text-gray-900 cursor-pointer">
                            {themeOption.label}
                          </label>
                          <p className="text-xs text-gray-500">{themeOption.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Color preview */}
                    <div className={`flex gap-1 ${
                      themeOption.value === 'dark' ? 'bg-gray-800' : 
                      themeOption.value === 'ocean' ? 'bg-blue-50' : 
                      themeOption.value === 'forest' ? 'bg-green-50' : 
                      themeOption.value === 'sunset' ? 'bg-orange-50' : 
                      themeOption.value === 'pink' ? 'bg-pink-50' : 
                      'bg-gray-50'
                    } p-2 rounded`}>
                      <div className={`w-3 h-3 rounded ${
                        themeOption.value === 'dark' ? 'bg-slate-600' : 
                        themeOption.value === 'ocean' ? 'bg-blue-500' : 
                        themeOption.value === 'forest' ? 'bg-green-500' : 
                        themeOption.value === 'sunset' ? 'bg-orange-500' : 
                        themeOption.value === 'pink' ? 'bg-pink-500' : 
                        'bg-gray-400'
                      }`}></div>
                      <div className={`w-3 h-3 rounded ${
                        themeOption.value === 'dark' ? 'bg-blue-400' : 
                        themeOption.value === 'ocean' ? 'bg-cyan-400' : 
                        themeOption.value === 'forest' ? 'bg-emerald-400' : 
                        themeOption.value === 'sunset' ? 'bg-yellow-400' : 
                        themeOption.value === 'pink' ? 'bg-rose-400' : 
                        'bg-blue-500'
                      }`}></div>
                      <div className={`w-3 h-3 rounded ${
                        themeOption.value === 'dark' ? 'bg-gray-300' : 
                        themeOption.value === 'ocean' ? 'bg-blue-200' : 
                        themeOption.value === 'forest' ? 'bg-green-200' : 
                        themeOption.value === 'sunset' ? 'bg-orange-200' : 
                        themeOption.value === 'pink' ? 'bg-pink-200' : 
                        'bg-gray-200'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Security</h2>
            </div>
            <div className="p-6">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {showChangePassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>
          </div>

          {/* Change Password Form */}
          {showChangePassword && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
              </div>
              <div className="p-6">
                <ChangePasswordForm
                  onSuccess={() => {
                    setShowChangePassword(false);
                    setSuccess('Password changed successfully');
                  }}
                />
              </div>
            </div>
          )}

          {/* Account Information */}
          {userProfile && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                      {new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Updated
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                      {new Date(userProfile.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Links */}
          {isAdmin && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Admin Actions</h2>
              </div>
              <div className="p-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/admin')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Admin Panel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
