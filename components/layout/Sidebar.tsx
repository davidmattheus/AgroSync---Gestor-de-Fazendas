import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardIcon, TractorIcon, FuelIcon, WrenchIcon, UsersIcon, ReportIcon, LogoutIcon, SettingsIcon, BoxIcon, ShoppingCartIcon } from '../ui/Icons';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/machines', label: 'Máquinas', icon: <TractorIcon /> },
  { to: '/fueling', label: 'Abastecimentos', icon: <FuelIcon /> },
  { to: '/maintenance', label: 'Manutenções', icon: <WrenchIcon /> },
  { to: '/warehouse', label: 'Almoxarifado', icon: <BoxIcon /> },
  { to: '/purchases', label: 'Compras', icon: <ShoppingCartIcon /> },
  { to: '/collaborators', label: 'Colaboradores', icon: <UsersIcon /> },
  { to: '/reports', label: 'Relatórios', icon: <ReportIcon /> },
];

const bottomNavItems: NavItem[] = [
    { to: '/settings', label: 'Configurações', icon: <SettingsIcon /> },
];

const Sidebar: React.FC<{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void; }> = ({ sidebarOpen, setSidebarOpen }) => {
  const { logout } = useAuth();
  
  const NavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-lg font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-agro-green text-white'
        : 'text-agro-gray-600 hover:bg-agro-light-green hover:text-agro-green'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-20 border-b">
        <h1 className="text-3xl font-bold text-agro-green">AgroSync</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={NavLinkClasses} onClick={() => setSidebarOpen(false)}>
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-6 mt-auto border-t space-y-2">
           {bottomNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={NavLinkClasses} onClick={() => setSidebarOpen(false)}>
                <span className="mr-3">{item.icon}</span>
                {item.label}
            </NavLink>
          ))}
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-lg font-medium text-agro-gray-600 rounded-lg hover:bg-red-100 hover:text-red-600"
          >
            <LogoutIcon className="mr-3" />
            Sair
          </button>
      </div>
    </div>
  );


  return (
    <>
      <div className="hidden md:flex md:flex-shrink-0 print-hidden">
        <div className="flex flex-col w-64">
          <div className="bg-white border-r h-full">
            {sidebarContent}
          </div>
        </div>
      </div>
       {/* Mobile sidebar */}
       <div className={`fixed inset-0 z-40 flex md:hidden print-hidden ${sidebarOpen ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setSidebarOpen(false)}>
                        <span className="sr-only">Close sidebar</span>
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {sidebarContent}
            </div>
            <div className="flex-shrink-0 w-14"></div>
        </div>
    </>
  );
};

export default Sidebar;