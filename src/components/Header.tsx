import React from 'react';
import { Menu, Bell, Settings, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu size={24} className="text-slate-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🍽️</div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
                Restoran Yönetim Sistemi
              </h1>
              <h1 className="text-lg font-bold text-slate-800 sm:hidden">
                Restoran
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Profesyonel Yönetim Paneli
              </p>
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors relative">
            <Bell size={20} className="text-slate-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <Settings size={20} className="text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-300"></div>
          <button className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}