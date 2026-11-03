'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/services/api';
import {
  Shield,
  Users,
  Radio,
  Compass,
  Search,
  CheckCircle,
  Ban,
  ArrowLeft,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Guard: Admin or Moderator role required
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'moderator') {
      toast.error('អ្នកគ្មានសិទ្ធិចូលមើលទំព័រនេះទេ (Access Denied)');
      router.push('/map');
    }
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers({ page, search }),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (usersRes.data?.users) setUsers(usersRes.data.users);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      toast.success('បានផ្លាស់ប្តូរស្ថានភាពអ្នកប្រើប្រាស់');
    } catch (e) {
      toast.error('បរាជ័យក្នុងការផ្លាស់ប្តូរស្ថានភាព');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('បានផ្លាស់ប្តូរសិទ្ធិ (Role updated)');
    } catch (e) {
      toast.error('បរាជ័យក្នុងការផ្លាស់ប្តូរសិទ្ធិ');
    }
  };

  return (
    <MainLayout title="ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធ (Admin Dashboard)" showNav={true} showBottom={true} showBack={true}>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-xs font-semibold text-gray-500">អ្នកប្រើសរុប</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900">{stats.totalUsers}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Total Registered</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-semibold text-gray-500">សកម្ម</span>
              </div>
              <h3 className="text-2xl font-black text-emerald-600">{stats.activeUsers}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Active Accounts</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-cyan-600 mb-2">
                <Radio className="w-5 h-5" />
                <span className="text-xs font-semibold text-gray-500">អនឡាញ</span>
              </div>
              <h3 className="text-2xl font-black text-cyan-600">{stats.onlineUsers || 1}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Connected Now</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Compass className="w-5 h-5" />
                <span className="text-xs font-semibold text-gray-500">នាំផ្លូវ</span>
              </div>
              <h3 className="text-2xl font-black text-amber-600">{stats.activeNavigations}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Active Routes</p>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base">ការគ្រប់គ្រងអ្នកប្រើប្រាស់ (User Management)</h3>
              <p className="text-xs text-gray-400">Manage account status and roles</p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ស្វែងរក... (Search)"
                  className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" className="rounded-xl px-4 text-xs">
                ស្វែងរក
              </Button>
            </form>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3 rounded-l-xl">អ្នកប្រើ (User)</th>
                  <th className="p-3">អ៊ីមែល (Email)</th>
                  <th className="p-3">សិទ្ធិ (Role)</th>
                  <th className="p-3">ស្ថានភាព (Status)</th>
                  <th className="p-3 rounded-r-xl text-right">សកម្មភាព (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={u.avatarUrl} name={u.displayName} size="sm" />
                        <div>
                          <p className="font-bold text-gray-900">{u.displayName}</p>
                          <p className="text-[10px] text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      {user?.role === 'admin' ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-transparent border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="font-semibold capitalize">{u.role}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(u.id, 'suspended')}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(u.id, 'active')}
                          className="px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg font-semibold transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
