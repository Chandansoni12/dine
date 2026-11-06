import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ShoppingBag, Award, Clock, Utensils, User, Star } from 'lucide-react';
import { RESTAURANT_INFO } from '../../data/seedData';

interface CustomerHeaderProps {
  onOpenCart: () => void;
  onOpenLoyalty: () => void;
  onOpenOrderStatus: () => void;
  onOpenLogin: () => void;
  onOpenReview: () => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  onOpenCart,
  onOpenLoyalty,
  onOpenOrderStatus,
  onOpenLogin,
  onOpenReview,
}) => {
  const {
    currentTable,
    customerSession,
    cartItems,
    cartTotalPaise,
    getCustomerActiveOrder,
    getLoyaltyForPhone,
    logoutCustomer,
    isRealTimeConnected,
  } = useRestaurant();

  const activeOrder = getCustomerActiveOrder();
  const loyalty = customerSession ? getLoyaltyForPhone(customerSession.phone) : null;
  const totalItemsCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Restaurant Brand & Table Context */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 tracking-tight leading-tight">
                {RESTAURANT_INFO.name}
              </span>
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                <span>Table {currentTable}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isRealTimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                  title={isRealTimeConnected ? 'Live real-time sync active' : 'Connecting to live hub...'}
                />
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {RESTAURANT_INFO.tagline}
            </p>
          </div>
        </div>

        {/* Right: Actions (Reviews, Active Order, Stamps, Cart, Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Review button */}
          <button
            onClick={onOpenReview}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 text-xs font-semibold transition-colors"
            title="Rate dining experience or draft with AI"
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="hidden sm:inline">Review</span>
          </button>

          {/* Active Order Pill (if customer has an active order) */}
          {activeOrder && (
            <button
              onClick={onOpenOrderStatus}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeOrder.orderStatus === 'WAITING_FOR_WAITER'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                  : activeOrder.orderStatus === 'CONFIRMED' || activeOrder.orderStatus === 'PREPARING'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : activeOrder.orderStatus === 'READY'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="View live order status"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Order {activeOrder.id}:</span>
              <span className="capitalize">
                {activeOrder.orderStatus === 'WAITING_FOR_WAITER'
                  ? 'Verifying Table'
                  : activeOrder.orderStatus.toLowerCase()}
              </span>
            </button>
          )}

          {/* Loyalty Wallet Button (Desktop only, mobile has dock) */}
          {customerSession ? (
            <button
              onClick={onOpenLoyalty}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors"
              title="Open Loyalty Stamps Wallet"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>{loyalty?.stampsCount ?? 0}/6 Stamps</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}

          {/* Cart Trigger (Desktop only, mobile has dock) */}
          <button
            onClick={onOpenCart}
            className="hidden sm:flex relative items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Cart</span>
            {totalItemsCount > 0 && (
              <>
                <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {totalItemsCount}
                </span>
                <span className="font-mono text-[11px] text-amber-200">
                  ₹{(cartTotalPaise / 100).toFixed(0)}
                </span>
              </>
            )}
          </button>

          {/* Account Profile info or Switch */}
          {customerSession && (
            <div className="relative group">
              <button
                onClick={onOpenLogin}
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                title={`Signed in as ${customerSession.name || customerSession.phone}`}
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
