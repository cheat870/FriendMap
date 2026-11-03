'use client';

import { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Camera, Edit2, Shield, Calendar, Mail, Check, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const res = await authApi.uploadAvatar(formData);
      if (res.data?.data) {
        updateUser(res.data.data.user);
        toast.success('រូបភាពប្រវត្តិរូបត្រូវបានផ្លាស់ប្តូរ! (Avatar updated)');
      }
    } catch (err: any) {
      toast.error('បរាជ័យក្នុងការផ្លាស់ប្តូររូបភាព');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateProfile({ displayName, bio });
      if (res.data?.data) {
        updateUser(res.data.data);
        setEditing(false);
        toast.success('បានរក្សាទុកព័ត៌មាន (Profile saved)');
      }
    } catch (err: any) {
      toast.error('បរាជ័យក្នុងការរក្សាទុក');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="គណនីរបស់ខ្ញុំ (My Profile)" showNav={true} showBottom={true}>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="relative mb-3">
            <Avatar
              src={user?.avatarUrl}
              name={user?.displayName || 'User'}
              size="xl"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg border-2 border-white transition-all active:scale-95"
              title="Upload Avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900">{user?.displayName}</h2>
          <p className="text-xs text-gray-400 mt-0.5">@{user?.username}</p>

          {user?.bio && (
            <p className="text-sm text-gray-600 mt-3 max-w-xs">{user.bio}</p>
          )}

          <div className="flex items-center gap-2 mt-4 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
            <Shield className="w-3.5 h-3.5" />
            <span className="capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">ព័ត៌មានផ្ទាល់ខ្លួន (Personal Info)</h3>
            <button
              onClick={() => setEditing(!editing)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{editing ? 'បោះបង់ (Cancel)' : 'កែប្រែ (Edit)'}</span>
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  ឈ្មោះបង្ហាញ (Display Name)
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  អំពីខ្ញុំ (Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your friends something about you..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <Button type="submit" variant="primary" fullWidth loading={saving} className="rounded-xl">
                រក្សាទុកការផ្លាស់ប្តូរ (Save Changes)
              </Button>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">អ៊ីមែល (Email)</p>
                  <p className="text-xs font-semibold text-gray-800">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">បានចូលរួមនៅ (Joined)</p>
                  <p className="text-xs font-semibold text-gray-800">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors border border-red-100"
        >
          <LogOut className="w-4 h-4" />
          <span>ចាកចេញពីគណនី (Log Out)</span>
        </button>
      </div>
    </MainLayout>
  );
}
