'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RiDashboardLine, RiArrowDownCircleLine, RiArrowUpCircleLine, RiFlag2Line, RiMenuLine, RiCloseLine, RiLogoutBoxLine, RiWalletLine, RiBankCardLine, RiSettings4Line } from 'react-icons/ri';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { href: '/expenses', label: 'Spese', icon: RiArrowDownCircleLine },
  { href: '/income', label: 'Guadagni', icon: RiArrowUpCircleLine },
  { href: '/goals', label: 'Obiettivi', icon: RiFlag2Line },
  { href: '/cards', label: 'Carte', icon: RiBankCardLine },
  { href: '/settings', label: 'Impostazioni', icon: RiSettings4Line },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#1e2235] border border-[#2a3050] rounded-xl p-2 text-white"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        {open ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#181c27] border-r border-[#2a3050] z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#2a3050]">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
            <RiWalletLine size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">WDFinance</h1>
            <p className="text-xs text-[#8b9ccc]">Gestione Finanziaria</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${active
                    ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/30'
                    : 'text-[#8b9ccc] hover:bg-[#1e2235] hover:text-white'
                  }`}
              >
                <Icon size={20} className={active ? 'text-blue-400' : 'text-[#8b9ccc] group-hover:text-blue-400'} />
                <span className="font-medium text-sm">{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-[#2a3050]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1e2235]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.email ?? ''}</p>
              <p className="text-[10px] text-[#8b9ccc]">Account attivo</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-[#8b9ccc] hover:text-red-400 transition-colors"
            >
              <RiLogoutBoxLine size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
