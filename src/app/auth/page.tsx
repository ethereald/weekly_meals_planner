'use client';

import { useState, useEffect } from 'react';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { AdminSetupForm } from '@/components/auth/AdminSetupForm';
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
  const [hasUsers, setHasUsers] = useState(true); // Assume users exist by default
  const [checkingUsers, setCheckingUsers] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authApi.checkAuth();
        if (isAuth) {
          const profile = await authApi.getProfile();
          setUser(profile.user);
          setIsAuthenticated(true);
          setHasUsers(true); // If user is authenticated, users obviously exist
        } else {
          setIsAuthenticated(false);
          
          // Check if any users exist in the database
          try {
            console.log('Checking if users exist...');
            const response = await fetch('/api/auth/check-users');
            console.log('Check users response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Check users response data:', data);
            setHasUsers(data.hasUsers);
          } catch (error) {
            console.error('Failed to check users:', error);
            setHasUsers(true); // Default to showing login form if check fails
          }
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
        setIsAuthenticated(false);
      }
      setLoading(false);
      setCheckingUsers(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setIsAuthenticated(false);
      setUser(null);
      setShowChangePassword(false);
      // Redirect to home page, which will redirect to auth page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAdminSetupSuccess = () => {
    // After admin setup, redirect to the home page
    window.location.href = '/';
  };

  if (loading || checkingUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show admin setup form if no users exist
  if (!isAuthenticated && !hasUsers) {
    return <AdminSetupForm onSuccess={handleAdminSetupSuccess} />;
  }

  if (!isAuthenticated) {
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
            <p><span className="font-medium">Session:</span> Active (HTTP-only cookie)</p>
            <p className="text-sm text-gray-600">
              This page demonstrates that the authentication system is working correctly.
              You can register new users, login, logout, and change passwords.
              Authentication is now managed via secure HTTP-only cookies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
