import React, { useState, useEffect } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { StaffRole } from './types/restaurant';
import { CustomerHeader } from './components/customer/CustomerHeader';
import { CustomerMenu } from './components/customer/CustomerMenu';
import { CartDrawer } from './components/customer/CartDrawer';
import { CustomerOrderStatusModal } from './components/customer/CustomerOrderStatusModal';
import { LoyaltyWalletModal } from './components/customer/LoyaltyWalletModal';
import { CustomerReviewModal } from './components/customer/CustomerReviewModal';
import { CustomerLoginModal } from './components/customer/CustomerLoginModal';
import { StaffLoginModal } from './components/staff/StaffLoginModal';
import { StaffPortalContainer } from './components/staff/StaffPortalContainer';
import { MobileBottomDock } from './components/customer/MobileBottomDock';
import { RESTAURANT_INFO } from './data/seedData';
import {
  Lock,
  ShieldCheck,
  Award,
  Sparkles,
  Phone,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Bell,
  LayoutDashboard,
} from 'lucide-react';

const CustomerDineInApp: React.FC = () => {
  const {
    currentTable,
    setCurrentTable,
    customerSession,
    getCustomerActiveOrder,
    activeStaff,
    isStaffPortalOpen,
    setIsStaffPortalOpen,
    orders,
  } = useRestaurant();

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderStatusOpen, setIsOrderStatusOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [targetStaffRole, setTargetStaffRole] = useState<StaffRole>('waiter');

  // Handle URL Hash navigation and First-Time Visitor Login Prompt
  useEffect(() => {
    const handleNavigationAndSession = () => {
      const hash = (window.location.hash || '').toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const roleParam = (search.get('role') || search.get('view') || '').toLowerCase();

      // Check for direct staff screen routes
      if (hash === '#waiter' || roleParam === 'waiter') {
        setTargetStaffRole('waiter');
        setIsStaffPortalOpen(true);
        return;
      }
      if (hash === '#admin' || hash === '#manager' || roleParam === 'admin' || roleParam === 'manager') {
        setTargetStaffRole('manager');
        setIsStaffPortalOpen(true);
        return;
      }
      if (hash === '#kitchen' || roleParam === 'kitchen') {
        setTargetStaffRole('kitchen');
        setIsStaffPortalOpen(true);
        return;
      }
      if (hash === '#cashier' || roleParam === 'cashier') {
        setTargetStaffRole('cashier');
        setIsStaffPortalOpen(true);
        return;
      }

      // First-time customer visit detection:
      // If customer has no remembered session on this device, automatically open the phone sign-in modal!
      if (!customerSession && !isStaffPortalOpen && !activeStaff) {
        const timer = setTimeout(() => {
          setIsLoginModalOpen(true);
        }, 400);
        return () => clearTimeout(timer);
      }
    };

    handleNavigationAndSession();
    window.addEventListener('hashchange', handleNavigationAndSession);
    return () => window.removeEventListener('hashchange', handleNavigationAndSession);
  }, [customerSession, isStaffPortalOpen, activeStaff]);

  // If staff is authenticated or portal is toggled open, render Staff Operations View
  if (isStaffPortalOpen || activeStaff) {
    return <StaffPortalContainer initialRole={targetStaffRole} />;
  }

  const activeOrder = getCustomerActiveOrder();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Customer Dedicated Header */}
      <CustomerHeader
        onOpenCart={() => setIsCartOpen(true)}
        onOpenLoyalty={() => setIsLoyaltyOpen(true)}
        onOpenOrderStatus={() => setIsOrderStatusOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenReview={() => setIsReviewOpen(true)}
        onOpenStaffLogin={() => setIsStaffLoginOpen(true)}
      />

      {/* 2. Table Welcome Banner & Quick Dine-in Info */}
      <section className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/50 py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowTablePicker(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-950 text-xs shadow-xs hover:bg-amber-50 transition-colors"
                title="Change Table Number"
              >
                <span>TABLE {currentTable}</span>
                <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
              </button>

              {/* Table Switch Dropdown for Demo */}
              {showTablePicker && (
                <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 grid grid-cols-3 gap-1">
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(
                    t => (
                      <button
                        key={t}
                        onClick={() => {
                          setCurrentTable(t);
                          setShowTablePicker(false);
                        }}
                        className={`p-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                          currentTable === t
                            ? 'bg-amber-500 text-slate-950'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        T-{t}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Welcome, {customerSession?.name || 'Guest'}
                </span>
                {customerSession?.rememberDevice && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Device Remembered
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Browse menu & customize · Waiter physically verifies table upon request
              </p>
            </div>
          </div>

          {/* Quick Active Order Alert Banner if in progress */}
          {activeOrder && (
            <div
              onClick={() => setIsOrderStatusOpen(true)}
              className="bg-white/90 border border-amber-200/80 hover:border-amber-300 rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer shadow-xs transition-all"
            >
              <div className="text-left text-xs">
                <span className="font-bold text-slate-800">Order #{activeOrder.id}:</span>{' '}
                <span className="font-semibold text-amber-700 capitalize">
                  {activeOrder.orderStatus === 'WAITING_FOR_WAITER'
                    ? 'Checking Table Presence...'
                    : activeOrder.orderStatus.toLowerCase()}
                </span>
              </div>
              <span className="text-[11px] text-amber-700 font-bold hover:underline">
                View Tracker →
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 2B. Direct Staff & Admin Switcher Banner (Prominent One-Click Access) */}
      <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 text-[11px] font-medium">Looking for Waiter / Admin pages?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTargetStaffRole('waiter');
                window.location.hash = '#waiter';
                setIsStaffLoginOpen(true);
              }}
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Waiter Screen (PIN: 1111)</span>
            </button>
            <button
              onClick={() => {
                setTargetStaffRole('manager');
                window.location.hash = '#admin';
                setIsStaffLoginOpen(true);
              }}
              className="flex items-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Page (PIN: 4444)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Customer Digital Menu */}
      <main className="flex-1">
        <CustomerMenu onOpenCart={() => setIsCartOpen(true)} />

        {/* 3B. Verified Guest Reviews Section */}
        <section className="max-w-5xl mx-auto px-4 pb-12 pt-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 tracking-tight">
                    Verified Diner Reviews & Ratings
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    4.9 / 5.0
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real feedback from dine-in guests at Table 01 - Table 12
                </p>
              </div>

              <button
                onClick={() => setIsReviewOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Write Review (AI Assistant)</span>
              </button>
            </div>

            {/* List of customer reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {orders
                .filter(o => o.review)
                .map(order => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {order.customerName || 'Verified Diner'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Table {order.tableNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: order.review?.rating || 5 }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-700 italic leading-relaxed">
                      "{order.review?.comment}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Order #{order.id}</span>
                      <span>{new Date(order.review?.createdAt || order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </main>

      {/* 4. Customer Footer with Discreet Staff Portal Link */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 mt-auto pb-24 sm:pb-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-slate-800">{RESTAURANT_INFO.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {RESTAURANT_INFO.address} · GSTIN: {RESTAURANT_INFO.gstNumber}
            </p>
          </div>

          {/* Customer Support & Discreet Employee Portal Trigger */}
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsLoyaltyOpen(true)}
              className="hover:text-amber-700 transition-colors"
            >
              Loyalty Rules
            </button>
            <span>·</span>
            <button
              onClick={() => setIsReviewOpen(true)}
              className="hover:text-amber-700 font-semibold text-slate-700 transition-colors"
            >
              Write Review (AI)
            </button>
            <span>·</span>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="hover:text-amber-700 transition-colors"
            >
              Account Phone
            </button>
            <span>·</span>
            {/* Dedicated Fast Navigators for Waiter and Admin */}
            <button
              onClick={() => {
                setTargetStaffRole('waiter');
                window.location.hash = '#waiter';
              }}
              className="flex items-center gap-1 text-amber-900 bg-amber-100/70 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg font-bold transition-colors shadow-xs"
            >
              <Bell className="w-3 h-3 text-amber-600" />
              <span>Waiter Screen</span>
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setTargetStaffRole('manager');
                window.location.hash = '#admin';
              }}
              className="flex items-center gap-1 text-purple-900 bg-purple-100/70 hover:bg-purple-100 border border-purple-300 px-2.5 py-1 rounded-lg font-bold transition-colors shadow-xs"
            >
              <LayoutDashboard className="w-3 h-3 text-purple-600" />
              <span>Admin Screen</span>
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setTargetStaffRole('waiter');
                setIsStaffLoginOpen(true);
              }}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg font-medium transition-colors"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Staff PIN</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 5. Modals & Drawers */}
      <CustomerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenStaff={() => setIsStaffLoginOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSubmitted={() => setIsOrderStatusOpen(true)}
      />

      <CustomerOrderStatusModal
        isOpen={isOrderStatusOpen}
        onClose={() => setIsOrderStatusOpen(false)}
        onOpenReview={() => setIsReviewOpen(true)}
        onOpenLoyalty={() => setIsLoyaltyOpen(true)}
      />

      <LoyaltyWalletModal
        isOpen={isLoyaltyOpen}
        onClose={() => setIsLoyaltyOpen(false)}
      />

      <CustomerReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />

      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onSuccess={() => setIsStaffPortalOpen(true)}
        initialRole={targetStaffRole}
      />

      {/* 6. Mobile Bottom Dock Navigation */}
      <MobileBottomDock
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrderStatus={() => setIsOrderStatusOpen(true)}
        onOpenLoyalty={() => setIsLoyaltyOpen(true)}
        onOpenStaff={() => setIsStaffLoginOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <RestaurantProvider>
      <CustomerDineInApp />
    </RestaurantProvider>
  );
}
