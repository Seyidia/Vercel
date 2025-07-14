import React from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Receipt, 
  BarChart3, 
  Menu,
  X,
  ChefHat
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: 'products', label: 'Ürün Yönetimi', icon: Package },
  { id: 'waiters', label: 'Garson Yönetimi', icon: Users },
  { id: 'orders', label: 'Sipariş Takibi', icon: ShoppingCart },
  { id: 'bills', label: 'Hesap Yönetimi', icon: Receipt },
  { id: 'reports', label: 'Gelir Raporu', icon: BarChart3 },
];

export default function Sidebar({ currentView, setCurrentView, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        text-white transform transition-all duration-300 ease-in-out z-50 shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <ChefHat size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Restoran
              </h1>
              <p className="text-xs text-slate-400 font-medium">Yönetim Paneli</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-6 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-200
                  group relative overflow-hidden
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
                    : 'hover:bg-slate-700/50 text-slate-300 hover:text-white hover:scale-105'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-white/20 shadow-lg' 
                    : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                  }
                `}>
                  <Icon size={20} />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-700/50">
          <div className="text-center">
            <p className="text-xs text-slate-400">© 2024 Restoran Yönetimi</p>
            <p className="text-xs text-slate-500 mt-1">v1.0.0</p>
          </div>
        </div>
      </div>
    </>
  );
}