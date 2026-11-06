import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChefHat,
  Utensils,
  Receipt,
  Star,
  RefreshCw,
  Award,
  Bell,
  Droplet,
  Check,
} from 'lucide-react';
import { ServiceRequestType } from '../../types/restaurant';

interface CustomerOrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReview: () => void;
  onOpenLoyalty: () => void;
}

export const CustomerOrderStatusModal: React.FC<CustomerOrderStatusModalProps> = ({
  isOpen,
  onClose,
  onOpenReview,
  onOpenLoyalty,
}) => {
  const { currentTable, getCustomerActiveOrder, orders, requestService } = useRestaurant();
  const activeOrder = getCustomerActiveOrder();
  const [serviceFeedback, setServiceFeedback] = useState<string | null>(null);

  const handleCallService = async (type: ServiceRequestType, label: string) => {
    const success = await requestService(type);
    if (success) {
      setServiceFeedback(`${label} sent for Table ${currentTable}!`);
      setTimeout(() => setServiceFeedback(null), 3000);
    }
  };

  if (!isOpen) return null;

  if (!activeOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-md bg-white rounded-3xl p-6 text-center shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Active Order for Table {currentTable}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse our menu and submit an order request to track its live status.
          </p>
        </div>
      </div>
    );
  }

  const { orderStatus, paymentStatus, waiterAction, kitchenAction, items, totalPaise, id } =
    activeOrder;

  // Compute stage steps
  const steps = [
    {
      title: 'Order Requested',
      description: 'Dine-in Order Placed',
      isCompleted: true,
      isActive: orderStatus === 'WAITING_FOR_WAITER',
    },
    {
      title: 'Waiter Verification',
      description:
        orderStatus === 'WAITING_FOR_WAITER'
          ? 'Floor waiter is physically verifying Table ' + currentTable
          : waiterAction
          ? `Verified by ${waiterAction.staffName}`
          : 'Pending verification',
      isCompleted:
        orderStatus === 'CONFIRMED' ||
        orderStatus === 'PREPARING' ||
        orderStatus === 'READY' ||
        orderStatus === 'SERVED',
      isActive: orderStatus === 'WAITING_FOR_WAITER',
    },
    {
      title: 'Kitchen Preparation',
      description:
        orderStatus === 'PREPARING'
          ? 'Chef is cooking your order'
          : orderStatus === 'CONFIRMED'
          ? 'Ticket accepted by kitchen'
          : 'Waiting for waiter gate',
      isCompleted: orderStatus === 'READY' || orderStatus === 'SERVED',
      isActive: orderStatus === 'CONFIRMED' || orderStatus === 'PREPARING',
    },
    {
      title: 'Ready & Serving',
      description: orderStatus === 'SERVED' ? 'Delivered to Table' : 'Plated at kitchen pass',
      isCompleted: orderStatus === 'SERVED',
      isActive: orderStatus === 'READY',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Mobile sheet handle */}
        <div className="w-10 h-1 bg-slate-600/40 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-amber-400 font-bold">
                Order #{id}
              </span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-200">
                Table {currentTable}
              </span>
            </div>
            <h3 className="text-lg font-bold tracking-tight mt-0.5">Live Order Tracker</h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current State Status Banner */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            orderStatus === 'WAITING_FOR_WAITER'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : orderStatus === 'CONFIRMED' || orderStatus === 'PREPARING'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
              : orderStatus === 'READY'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : orderStatus === 'SERVED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {orderStatus === 'WAITING_FOR_WAITER' && (
              <Clock className="w-5 h-5 text-amber-600 animate-spin" />
            )}
            {orderStatus === 'CONFIRMED' && <CheckCircle className="w-5 h-5 text-indigo-600" />}
            {orderStatus === 'PREPARING' && <ChefHat className="w-5 h-5 text-indigo-600 animate-bounce" />}
            {orderStatus === 'READY' && <Utensils className="w-5 h-5 text-emerald-600" />}
            {orderStatus === 'SERVED' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            {orderStatus === 'REJECTED' && <AlertTriangle className="w-5 h-5 text-rose-600" />}

            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {orderStatus === 'WAITING_FOR_WAITER'
                  ? 'WAITING FOR WAITER'
                  : orderStatus === 'CONFIRMED'
                  ? 'CONFIRMED BY WAITER'
                  : orderStatus === 'PREPARING'
                  ? 'KITCHEN IS COOKING'
                  : orderStatus === 'READY'
                  ? 'FOOD READY AT PASS'
                  : orderStatus === 'SERVED'
                  ? 'SERVED & DELIVERED'
                  : 'ORDER CANCELLED'}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {orderStatus === 'WAITING_FOR_WAITER'
                  ? 'A floor waiter will physically visit Table ' + currentTable + ' to verify and approve.'
                  : orderStatus === 'PREPARING'
                  ? 'Items are sizzling in the tandoor and kitchen.'
                  : orderStatus === 'READY'
                  ? 'Waitstaff is bringing fresh hot food to your table.'
                  : orderStatus === 'SERVED'
                  ? 'Enjoy your meal! You can settle your bill with the cashier or online.'
                  : waiterAction?.rejectionReason || 'Please speak with your floor waiter.'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Tracker Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Progress Timeline */}
          <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {steps.map((st, i) => (
              <div key={i} className="relative">
                <div
                  className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                    st.isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : st.isActive
                      ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {st.isCompleted ? '✓' : i + 1}
                </div>
                <div>
                  <h4
                    className={`text-xs font-bold ${
                      st.isActive
                        ? 'text-amber-800'
                        : st.isCompleted
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{st.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ordered Line Items Snapshot */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Items in Ticket</span>
              <span className="font-mono text-slate-600">{items.length} items</span>
            </h4>
            <div className="divide-y divide-slate-200 text-xs">
              {items.map((it, idx) => (
                <div key={idx} className="py-2 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800">
                      {it.quantity}x {it.name}
                    </span>
                    {it.selectedPortion && (
                      <span className="text-slate-500 text-[11px] ml-1">({it.selectedPortion})</span>
                    )}
                    {it.selectedAddOns.length > 0 && (
                      <p className="text-[10px] text-slate-500">+ {it.selectedAddOns.join(', ')}</p>
                    )}
                    {it.notes && (
                      <p className="text-[10px] italic text-amber-700">Note: {it.notes}</p>
                    )}
                  </div>
                  <span className="font-mono font-medium text-slate-700">
                    ₹{(it.totalPricePaise / 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill summary */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-bold text-xs text-slate-900">
              <span>Total Bill (Incl. GST)</span>
              <span className="font-mono text-sm text-slate-900">
                ₹{(totalPaise / 100).toFixed(0)}
              </span>
            </div>
          </div>

          {/* Table Assistance / Call Service */}
          <div className="bg-amber-500/10 border border-amber-300/60 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-700" />
                <span>Need Table Assistance?</span>
              </span>
              {serviceFeedback && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {serviceFeedback}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => handleCallService('waiter', 'Waiter call')}
                className="p-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-xl font-semibold text-slate-800 flex items-center justify-center gap-1 shadow-xs transition-colors active:scale-95"
              >
                <span>🙋‍♂️ Waiter</span>
              </button>
              <button
                onClick={() => handleCallService('water', 'Water request')}
                className="p-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-xl font-semibold text-slate-800 flex items-center justify-center gap-1 shadow-xs transition-colors active:scale-95"
              >
                <span>💧 Water</span>
              </button>
              <button
                onClick={() => handleCallService('bill', 'Bill request')}
                className="p-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-xl font-semibold text-slate-800 flex items-center justify-center gap-1 shadow-xs transition-colors active:scale-95"
              >
                <span>🧾 Bill</span>
              </button>
            </div>
          </div>

          {/* Payment & Stamp Status */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                Payment Status
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {paymentStatus}
                </span>
                {paymentStatus === 'PAID' && (
                  <span className="text-xs text-slate-500">
                    via {activeOrder.paymentMethod}
                  </span>
                )}
              </div>
            </div>

            {paymentStatus === 'PAID' ? (
              <div className="text-right">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                  <Award className="w-3.5 h-3.5" />
                  Stamp Awarded
                </span>
                <button
                  onClick={onOpenLoyalty}
                  className="text-xs text-amber-700 font-bold hover:underline"
                >
                  View Wallet →
                </button>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Settle at counter</span>
                <span className="text-xs font-semibold text-slate-700">Cash / UPI / Card</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          {/* Leave a review button if order is served or paid */}
          {(orderStatus === 'SERVED' || paymentStatus === 'PAID') && (
            <button
              onClick={() => {
                onClose();
                onOpenReview();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>{activeOrder.review ? 'View Your Review' : 'Rate Your Dining Experience'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
