import React from 'react';
import { TrendingUp, Calendar, Trophy, Loader, DollarSign, BarChart3 } from 'lucide-react';

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface RevenueReportProps {
  dailyRevenue: number;
  monthlyRevenue: number;
  topProducts: TopProduct[];
  loading: boolean;
}

export default function RevenueReport({ 
  dailyRevenue, 
  monthlyRevenue, 
  topProducts, 
  loading 
}: RevenueReportProps) {
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const monthFormatted = today.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long'
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 text-lg">Raporlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <BarChart3 className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gelir Raporu</h1>
            <p className="text-slate-600 mt-1">Satış performansınızı takip edin</p>
          </div>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Daily Revenue */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Calendar size={24} />
                </div>
                <h3 className="text-xl font-bold">Bugünkü Gelir</h3>
              </div>
              <TrendingUp size={24} className="opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-3">
              {dailyRevenue.toFixed(2)} ₺
            </div>
            <p className="text-emerald-100 text-sm font-medium">
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <DollarSign size={24} />
                </div>
                <h3 className="text-xl font-bold">Bu Ayki Gelir</h3>
              </div>
              <TrendingUp size={24} className="opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-3">
              {monthlyRevenue.toFixed(2)} ₺
            </div>
            <p className="text-blue-100 text-sm font-medium">
              {monthFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
              <Trophy className="text-white" size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">En Çok Satan Ürünler (Bu Ay)</h3>
          </div>
        </div>

        <div className="p-8">
          {topProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Trophy size={48} className="mx-auto" />
              </div>
              <p className="text-slate-500 text-lg">Henüz satış verisi yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg
                          ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                            index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 
                            'bg-gradient-to-br from-blue-400 to-blue-600'}
                        `}>
                          #{index + 1}
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg">{product.name}</h4>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Satış Adedi:</span>
                        <span className="font-bold text-slate-800 text-lg">{product.quantity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Toplam Gelir:</span>
                        <span className="font-bold text-emerald-600 text-lg">{product.revenue.toFixed(2)} ₺</span>
                      </div>
                    </div>
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