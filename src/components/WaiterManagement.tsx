import React, { useState, useEffect } from 'react';
import { UserPlus, Loader, Users, Mail, Lock, User, Trash2, Edit } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface Waiter {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  is_active: boolean;
  push_token?: string;
  created_at: string;
}

interface WaiterManagementProps {
  onAddWaiter: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  loading: boolean;
}

export default function WaiterManagement({ onAddWaiter, loading }: WaiterManagementProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [waitersLoading, setWaitersLoading] = useState(false);

  // Garsonları çek
  const fetchWaiters = async () => {
    setWaitersLoading(true);
    try {
      const { data, error } = await supabase
        .from('waiters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setWaiters(data || []);
    } catch (error) {
      console.error('Garsonlar çekilemedi:', error);
    } finally {
      setWaitersLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) return;
    
    await onAddWaiter(email, password, firstName, lastName);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    fetchWaiters(); // Garson listesini yenile
  };

  const handleDeleteWaiter = async (waiterId: string) => {
    if (!window.confirm('Bu garsonu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('waiters')
        .delete()
        .eq('id', waiterId);
      
      if (error) throw error;
      
      alert('Garson başarıyla silindi!');
      fetchWaiters();
    } catch (error) {
      console.error('Garson silinemedi:', error);
      alert('Garson silinemedi!');
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Users className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Garson Yönetimi</h1>
              <p className="text-slate-600 mt-1">Yeni garson hesabı oluşturun</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-slate-200/50">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <UserPlus className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Garson Bilgileri</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>Ad</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                  placeholder="Garsonun adı"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>Soyad</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                  placeholder="Garsonun soyadı"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                <div className="flex items-center space-x-2">
                  <Mail size={16} />
                  <span>E-posta</span>
                </div>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                placeholder="garson@example.com"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                <div className="flex items-center space-x-2">
                  <Lock size={16} />
                  <span>Şifre</span>
                </div>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                placeholder="Güvenli bir şifre"
                disabled={loading}
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !email || !password || !firstName || !lastName}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-3" size={24} />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-3" size={24} />
                    Garson Oluştur
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-blue-500 rounded-full mt-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Bilgi</h4>
                <p className="text-blue-700 text-sm">
                  Oluşturulan garson hesabı ile sistem giriş yapabilir ve sipariş alabilir.
                  E-posta adresi benzersiz olmalıdır.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mevcut Garsonlar Listesi */}
        <div className="mt-8 bg-white rounded-2xl shadow-2xl p-8 border border-slate-200/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Users className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Mevcut Garsonlar</h2>
          </div>

          {waitersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="animate-spin mr-3" size={24} />
              <span>Garsonlar yükleniyor...</span>
            </div>
          ) : waiters.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Henüz garson eklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-4">
              {waiters.map((waiter) => (
                <div key={waiter.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                      <User className="text-white" size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {waiter.first_name} {waiter.last_name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        ID: {waiter.id.slice(0, 8)}... | 
                        Durum: {waiter.is_active ? 'Aktif' : 'Pasif'} |
                        {waiter.push_token ? ' 📱 Bildirim Aktif' : ' 📱 Bildirim Yok'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDeleteWaiter(waiter.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Garsonu Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}