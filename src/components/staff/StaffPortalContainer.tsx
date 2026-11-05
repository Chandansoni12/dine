import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffRole } from '../../types/restaurant';
import { WaiterView } from './WaiterView';
import { KitchenView } from './KitchenView';
import { CashierView } from './CashierView';
import { ManagerView } from './ManagerView';
import {
  Bell,
  ChefHat,
  Receipt,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  User,
} from 'lucide-react';
import { RESTAURANT_INFO } from '../../data/seedData';

interface StaffPortalContainerProps {
  initialRole?: StaffRole;
}

export const StaffPortalContainer: React.FC<StaffPortalContainerProps> = ({ initialRole }) => {
  const { activeStaff, switchStaffRole, logoutStaff, orders } = useRestaurant();
  const [currentRoleView, setCurrentRoleView] = useState<StaffRole>(() => {
    if (initialRole) return initialRole;
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#manager') return 'manager';
      if (hash === '#waiter') return 'waiter';
      if (hash === '#kitchen') return 'kitchen';
      if (hash === '#cashier') return 'cashier';
    }
    return activeStaff?.role || 'waiter';
  });

  const pendingWaiterCount = orders.filter(o => o.orderStatus === 'WAITING_FOR_WAITER').length;
  const kitchenCount = orders.filter(
    o => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PREPARING'
  ).length;
  const unpaidCount = orders.filter(o => o.paymentStatus !== 'PAID').length;

  const handleRoleChange = (role: StaffRole) => {
    setCurrentRoleView(role);
    switchStaffRole(role);
    if (typeof window !== 'undefined') {
      const targetHash = role === 'manager' ? '#admin' : `#${role}`;
      window.history.replaceState(null, '', targetHash);
    }
  };

  const handleExitToCustomer = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    logoutStaff();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Staff Master Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand & Return to Customer button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitToCustomer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              title="Return to Customer Dining View"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Customer View</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  {RESTAURANT_INFO.name}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  Staff Operations
                </span>
              </div>
            </div>
          </div>

          {/* Center: Role Switcher Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => handleRoleChange('waiter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentRoleView === 'waiter'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Waiter Floor</span>
              {pendingWaiterCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    currentRoleView === 'waiter'
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-amber-500 text-slate-950 animate-pulse'
                  }`}
                >
                  {pendingWaiterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleRoleChange('kitchen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentRoleView === 'kitchen'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen KDS</span>
              {kitchenCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    currentRoleView === 'kitchen'
                      ? 'bg-white text-indigo-700'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  {kitchenCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleRoleChange('cashier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentRoleView === 'cashier'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Cashier</span>
              {unpaidCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    currentRoleView === 'cashier'
                      ? 'bg-white text-emerald-800'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {unpaidCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleRoleChange('manager')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentRoleView === 'manager'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </button>
          </nav>

          {/* Right: Active Staff User & Exit */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">{activeStaff?.name || 'Staff Member'}</span>
              <span className="text-[10px] text-slate-500 capitalize">({activeStaff?.role})</span>
            </div>

            <button
              onClick={logoutStaff}
              className="p-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 rounded-lg transition-colors"
              title="Lock & Exit Staff Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Staff Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentRoleView === 'waiter' && <WaiterView />}
        {currentRoleView === 'kitchen' && <KitchenView />}
        {currentRoleView === 'cashier' && <CashierView />}
        {currentRoleView === 'manager' && <ManagerView />}
      </main>
    </div>
  );
};
