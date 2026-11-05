import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  Award,
  BellRing,
  Droplet,
  FileText,
  Utensils,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { ServiceRequestType } from '../../types/restaurant';

interface MobileBottomDockProps {
  onOpenCart: () => void;
  onOpenOrderStatus: () => void;
  onOpenLoyalty: () => void;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  onOpenCart,
  onOpenOrderStatus,
  onOpenLoyalty,
}) => {
  const {
    currentTable,
    cartItems,
    cartTotalPaise,
    getCustomerActiveOrder,
    customerSession,
    getLoyaltyForPhone,
    requestService,
  } = useRestaurant();

  const [isServiceSheetOpen, setIsServiceSheetOpen] = useState(false);
  const [serviceFeedback, setServiceFeedback] = useState<string | null>(null);

  const activeOrder = getCustomerActiveOrder();
  const loyalty = customerSession ? getLoyaltyForPhone(customerSession.phone) : null;
  const totalCartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleServiceCall = async (type: ServiceRequestType, label: string) => {
    const success = await requestService(type);
    if (success) {
      setServiceFeedback(`${label} requested for Table ${currentTable}!`);
      setTimeout(() => {
        setServiceFeedback(null);
        setIsServiceSheetOpen(false);
      }, 1500);
    }
  };

  const scrollToMenu = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Quick Service Assistance Bottom Sheet */}
      {isServiceSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in sm:items-center p-0 sm:p-4">
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            {/* Sheet Handle for Mobile */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-amber-600" />
                  <span>Table Assistance</span>
                </h4>
                <p className="text-xs text-slate-500">Table {currentTable} · Floor staff will be notified</p>
              </div>

              <button
                onClick={() => setIsServiceSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {serviceFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{serviceFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleServiceCall('waiter', 'Waiter call')}
                className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all active:scale-95"
              >
                <span className="text-2xl">🙋‍♂️</span>
                <span className="text-xs font-bold text-amber-950">Call Waiter</span>
                <span className="text-[10px] text-amber-700">Physical visit</span>
              </button>

              <button
                onClick={() => handleServiceCall('water', 'Water request')}
                className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all active:scale-95"
              >
                <span className="text-2xl">💧</span>
                <span className="text-xs font-bold text-blue-950">Water & Glasses</span>
                <span className="text-[10px] text-blue-700">Fresh bottle/jug</span>
              </button>

              <button
                onClick={() => handleServiceCall('cutlery', 'Cutlery request')}
                className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all active:scale-95"
              >
                <span className="text-2xl">🍴</span>
                <span className="text-xs font-bold text-purple-950">Extra Cutlery</span>
                <span className="text-[10px] text-purple-700">Spoons & plates</span>
              </button>

              <button
                onClick={() => handleServiceCall('bill', 'Bill request')}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all active:scale-95"
              >
                <span className="text-2xl">🧾</span>
                <span className="text-xs font-bold text-emerald-950">Request Bill</span>
                <span className="text-[10px] text-emerald-700">Cash / UPI / Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Cart Bar (Appears above the dock if items are in cart) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-20 left-3 right-3 z-40 max-w-lg mx-auto sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 animate-slide-up">
          <div
            onClick={onOpenCart}
            className="p-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm">
                {totalCartCount}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>View Order Request</span>
                  <span className="text-[10px] font-mono text-amber-300">({totalCartCount} items)</span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  Total: ₹{(cartTotalPaise / 100).toFixed(0)} <span className="text-[10px] text-slate-400 font-sans font-normal">(Incl. GST)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-xs">
              <span>View Cart</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* 3. Modern Mobile Bottom Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
          {/* Menu Button */}
          <button
            onClick={scrollToMenu}
            className="flex flex-col items-center justify-center py-1 text-slate-700 hover:text-amber-600 transition-colors"
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Menu</span>
          </button>

          {/* Waiter / Assistance */}
          <button
            onClick={() => setIsServiceSheetOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-700 hover:text-amber-600 transition-colors relative"
          >
            <BellRing className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Assistance</span>
          </button>

          {/* Center Brand / Table Pill */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 -mt-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg flex items-center justify-center font-mono font-black text-xs border-2 border-white">
              T-{currentTable}
            </div>
            <span className="text-[9px] font-bold text-amber-800 uppercase tracking-tighter mt-0.5">Table</span>
          </div>

          {/* Live Order Tracker */}
          <button
            onClick={onOpenOrderStatus}
            className="flex flex-col items-center justify-center py-1 text-slate-700 hover:text-amber-600 transition-colors relative"
          >
            <Clock className={`w-5 h-5 ${activeOrder ? 'text-amber-600' : ''}`} />
            <span className="text-[10px] font-bold mt-1">Tracker</span>
            {activeOrder && (
              <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          {/* Loyalty Wallet */}
          <button
            onClick={onOpenLoyalty}
            className="flex flex-col items-center justify-center py-1 text-slate-700 hover:text-amber-600 transition-colors relative"
          >
            <Award className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] font-bold mt-1">
              {loyalty ? `${loyalty.stampsCount}/6` : 'Stamps'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

