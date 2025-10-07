import { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
import type { UserProfileUpdate, PasswordChangeRequest } from '../types/api';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user: currentUser, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState<UserProfileUpdate>({
    email: '',
    username: ''
  });
  
  const [passwordData, setPasswordData] = useState<PasswordChangeRequest>({
    current_password: '',
    new_password: ''
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        email: currentUser.email,
        username: currentUser.username
      });
    }
  }, [currentUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const updatedUser = await usersApi.updateProfile(profileData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await usersApi.changePassword(passwordData);
      setPasswordData({ current_password: '', new_password: '' });
      setConfirmPassword('');
      setSuccess('Password changed successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Editor': return 'bg-blue-100 text-blue-800';
      case 'Viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
            
            <div className="flex items-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xl font-medium text-gray-700">
                  {currentUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-4">
                <div className="flex items-center">
                  <div className="text-lg font-medium text-gray-900">{currentUser.username}</div>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-sm text-gray-500">{currentUser.email}</div>
              </div>
            </div>

            <div className="text-sm text-gray-400 space-y-1">
              <div>Account created: {new Date(currentUser.created_at).toLocaleDateString()}</div>
              {currentUser.last_login_at && (
                <div>Last login: {new Date(currentUser.last_login_at).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
