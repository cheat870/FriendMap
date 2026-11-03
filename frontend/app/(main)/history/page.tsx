'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { locationApi } from '@/services/api';
import { History, Trash2, Calendar, MapPin, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function LocationHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await locationApi.getHistory();
      if (res.data?.history) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDeleteAll = async () => {
    if (!confirm('តើអ្នកប្រាកដថាចង់លុបប្រវត្តិទីតាំងទាំងអស់មែនទេ? (Delete all history?)')) return;
    try {
      await locationApi.deleteHistory();
      setHistory([]);
      toast.success('ប្រវត្តិទីតាំងត្រូវបានលុប (History deleted)');
    } catch (e) {
      toast.error('បរាជ័យក្នុងការលុប');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await locationApi.deleteHistory(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      toast('បានលុប');
    } catch (e) {
      toast.error('បរាជ័យ');
    }
  };

  return (
    <MainLayout title="ប្រវត្តិទីតាំង (Location History)" showNav={true} showBottom={true} showBack={true}>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Top actions */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-500">
            ចំនួនកំណត់ត្រា: <b className="text-gray-900">{history.length}</b>
          </p>
          {history.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>លុបទាំងអស់ (Clear All)</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">កំពុងផ្ទុកប្រវត្តិទីតាំង...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 text-sm">មិនទាន់មានប្រវត្តិទីតាំងទេ</h3>
            <p className="text-xs text-gray-400 mt-1 mb-5">
              To track your routes, enable Location History in Settings.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 text-xs">
                      {Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}
                    </h5>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.recordedAt).toLocaleString()}
                      </span>
                      {item.accuracy && (
                        <span>• Accuracy: ±{Math.round(item.accuracy)}m</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
