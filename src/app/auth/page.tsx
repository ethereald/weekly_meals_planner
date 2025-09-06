'use client';

import { useState, useEffect } from 'react';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { authApi } from '@/lib/auth-client';

export default function AuthPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    username: string;
    createdAt: string;
    updatedAt?: string;
  } | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authApi.isAuthenticated()) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to get profile:', error);
          authApi.logout();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
    setShowChangePassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthWrapper onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.username}!</h1>
              <p className="text-gray-600">Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">User ID:</span> {user?.id}</p>
              <p><span className="font-medium">Username:</span> {user?.username}</p>
              <p><span className="font-medium">Created:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}</p>
              {user?.updatedAt && (
                <p><span className="font-medium">Last Updated:</span> {new Date(user.updatedAt).toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Password Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Security</h2>
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
          <div className="mt-6">
            <ChangePasswordForm
              onSuccess={() => {
                setShowChangePassword(false);
              }}
            />
          </div>
        )}

        {/* API Testing */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Authenticated:</span> ✅ Yes</p>
            <p><span className="font-medium">Token:</span> {authApi.getToken()?.substring(0, 20)}...</p>
            <p className="text-sm text-gray-600">
              This page demonstrates that the authentication system is working correctly.
              You can register new users, login, logout, and change passwords.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
