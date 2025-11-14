

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFarmData } from '../../context/FarmDataContext';
import { MenuIcon, ChevronDownIcon } from '../ui/Icons';

const Header: React.FC<{ setSidebarOpen: (open: boolean) => void; }> = ({ setSidebarOpen }) => {
  const { user } = useAuth();
  const { farm } = useFarmData();

  return (
    <header className="flex items-center justify-between h-16 px-4 bg-white border-b md:px-6 print-hidden">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 md:hidden focus:outline-none focus:text-gray-700"
        >
          <MenuIcon />
        </button>
        <h1 className="hidden ml-4 text-xl font-semibold text-agro-gray-800 md:block">
          Fazenda: <span className="font-bold text-agro-green">{farm.name}</span>
        </h1>
      </div>

      <div className="flex items-center">
        <div className="relative">
          <button className="flex items-center space-x-2">
            <div className="flex flex-col items-end text-sm">
                <span className="font-semibold text-agro-gray-800">{user?.name}</span>
                <span className="text-xs text-agro-gray-500">{user?.role}</span>
            </div>
            <div className="w-10 h-10 bg-agro-green rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user?.name.charAt(0)}
            </div>
            <ChevronDownIcon className="text-agro-gray-500"/>
          </button>
          {/* Dropdown can be implemented here */}
        </div>
      </div>
    </header>
  );
};

export default Header;