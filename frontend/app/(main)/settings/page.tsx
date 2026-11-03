'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { settingsApi } from '@/services/api';
import {
  Globe,
  Moon,
  Sun,
  Shield,
  MapPin,
  History,
  Bell,
  Lock,
  ChevronRight,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    language: 'km',
    theme: 'light',
    shareLocation: false,
    shareMode: 'all_friends',
    locationHistoryEnabled: false,
    historyRetentionDays: 7,
    notifyFriendRequest: true,
    notifyMessages: true,
    notifyArrival: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi
      .get()
      .then((res) => {
        if (res.data?.settings) {
          setSettings(res.data.settings);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = async (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await settingsApi.update({ [key]: value });
      toast.success('ការកំណត់ត្រូវបានរក្សាទុក (Settings updated)');
    } catch (err) {
      toast.error('បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាព');
    }
  };

  return (
    <MainLayout title="ការកំណត់ (Settings)" showNav={true} showBottom={true}>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Language Section */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm">ភាសា (Language)</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateSetting('language', 'km')}
              className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                settings.language === 'km'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              ភាសាខ្មែរ (Khmer - លំនាំដើម)
            </button>
            <button
              onClick={() => updateSetting('language', 'en')}
              className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                settings.language === 'en'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Location Sharing & Privacy */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-sm">ភាពឯកជនទីតាំង (Location Privacy)</h3>
          </div>

          {/* Master GPS Share Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <h4 className="font-semibold text-xs text-gray-900">ចែករំលែកទីតាំងផ្ទាល់ (Live Location Sharing)</h4>
              <p className="text-[11px] text-gray-400">អនុញ្ញាតឱ្យមិត្តភក្តិដែលបានយល់ព្រមមើលឃើញទីតាំងរបស់អ្នក</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.shareLocation}
                onChange={(e) => updateSetting('shareLocation', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Share Mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              របៀបនៃការចែករំលែក (Sharing Mode)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSetting('shareMode', 'all_friends')}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  settings.shareMode === 'all_friends'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                មិត្តទាំងអស់ (All Friends)
              </button>
              <button
                onClick={() => updateSetting('shareMode', 'paused')}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  settings.shareMode === 'paused'
                    ? 'border-amber-600 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                ផ្អាកបណ្តោះអាសន្ន (Pause)
              </button>
            </div>
          </div>
        </div>

        {/* Location History */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-indigo-600" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">ប្រវត្តិទីតាំង (Location History)</h4>
                <p className="text-[11px] text-gray-400">កត់ត្រាប្រវត្តិផ្លូវរបស់អ្នក (ឯកជនតែអ្នកប៉ុណ្ណោះ)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.locationHistoryEnabled}
                onChange={(e) => updateSetting('locationHistoryEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <Link
            href="/history"
            className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-700"
          >
            <span>មើលប្រវត្តិទីតាំងកន្លងមក (View History Logs)</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm">ការជូនដំណឹង (Notifications)</h3>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-50">
            <span className="text-xs text-gray-700">សំណើមិត្តភក្តិ (Friend Requests)</span>
            <input
              type="checkbox"
              checked={settings.notifyFriendRequest}
              onChange={(e) => updateSetting('notifyFriendRequest', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-50">
            <span className="text-xs text-gray-700">សារថ្មី (New Messages)</span>
            <input
              type="checkbox"
              checked={settings.notifyMessages}
              onChange={(e) => updateSetting('notifyMessages', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-700">ការមកដល់របស់មិត្តភក្តិ (Arrival Alerts)</span>
            <input
              type="checkbox"
              checked={settings.notifyArrival}
              onChange={(e) => updateSetting('notifyArrival', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
