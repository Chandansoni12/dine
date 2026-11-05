import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantOrder } from '../../types/restaurant';
import {
  BellRing,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Bell,
  Droplet,
  Check,
} from 'lucide-react';

export const WaiterView: React.FC = () => {
  const { orders, confirmOrder, rejectOrder, activeStaff, serviceRequests, resolveServiceRequest } = useRestaurant();
  const [rejectingOrder, setRejectingOrder] = useState<RestaurantOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('Table is empty / Phantom QR scan');
  const [customReason, setCustomReason] = useState('');

  // Pending orders waiting for waiter physical check
  const pendingOrders = orders.filter(o => o.orderStatus === 'WAITING_FOR_WAITER');
  
  // Pending table assistance calls
  const pendingServiceCalls = serviceRequests.filter(s => s.status === 'pending');

  // Confirmed / active orders on floor
  const confirmedOrders = orders.filter(
    o => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PREPARING' || o.orderStatus === 'READY'
  );

  const handleConfirm = (order: RestaurantOrder) => {
    confirmOrder(order.id, activeStaff?.id || 'ST-W01');
  };

  const handleRejectSubmit = () => {
    if (!rejectingOrder) return;
    const finalReason = customReason.trim() ? customReason : rejectReason;
    rejectOrder(rejectingOrder.id, activeStaff?.id || 'ST-W01', finalReason);
    setRejectingOrder(null);
    setCustomReason('');
  };

  const getTimeAgo = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification Protocol */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-200">
            Mandatory Verification Protocol (Screen 9 Blueprint)
          </h4>
          <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
            A QR code is not proof of physical presence. Verify the guest is physically seated at the table before confirming. Kitchen tickets only print upon waiter confirmation.
          </p>
        </div>
      </div>

      {/* Live Table Assistance Calls (Water, Waiter, Bill) */}
      {pendingServiceCalls.length > 0 && (
        <div className="p-4 bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white tracking-tight">Active Table Calls</h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold font-mono">
                {pendingServiceCalls.length} CALLS
              </span>
            </div>
            <span className="text-xs text-rose-300">Guests requesting attention</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {pendingServiceCalls.map(sc => (
              <div
                key={sc.id}
                className="p-3 bg-slate-900 border border-rose-500/50 rounded-xl flex items-center justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">Table {sc.tableNumber}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {sc.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{getTimeAgo(sc.requestedAt)}</span>
                </div>
                <button
                  onClick={() => resolveServiceRequest(sc.id)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Attended</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests Queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Pending Table Requests</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold font-mono">
              {pendingOrders.length} NEW
            </span>
          </div>
          <span className="text-xs text-slate-400">Requires Floor Verification</span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-200">No Pending Requests</h4>
            <p className="text-xs text-slate-400 mt-1">
              All table requests have been verified. New orders submitted by diners will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOrders.map(order => (
              <div
                key={order.id}
                className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 shadow-lg space-y-3.5 relative overflow-hidden"
              >
                {/* Header Strip */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-black bg-amber-500 text-slate-950 px-2.5 py-1 rounded-xl font-mono">
                      TABLE {order.tableNumber}
                    </span>
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-200">
                        Order #{order.id}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Submitted {getTimeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    NEW REQUEST
                  </span>
                </div>

                {/* Guest Details */}
                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.customerName || 'Guest Diner'}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">{order.customerPhone}</span>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 text-xs text-slate-200 divide-y divide-slate-800/80">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-start">
                      <div>
                        <span className="font-bold text-amber-200">{it.quantity}x</span>{' '}
                        <span className="font-medium text-slate-100">{it.name}</span>
                        {it.selectedPortion && (
                          <span className="text-[11px] text-slate-400 ml-1">({it.selectedPortion})</span>
                        )}
                        {it.selectedAddOns.length > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            + {it.selectedAddOns.join(', ')}
                          </span>
                        )}
                        {it.notes && (
                          <span className="text-[11px] text-amber-400/90 italic block mt-0.5">
                            "{it.notes}"
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-300">
                        ₹{(it.totalPricePaise / 100).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Order Amount</span>
                  <span className="font-mono font-bold text-base text-amber-300">
                    ₹{(order.totalPaise / 100).toFixed(0)}
                  </span>
                </div>

                {/* Physical Verification Checklist & Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleConfirm(order)}
                    className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>CONFIRM TABLE ORDER</span>
                  </button>
                  <button
                    onClick={() => setRejectingOrder(order)}
                    className="py-3 px-3 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 border border-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmed Orders on Floor (In Progress) */}
      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-base font-bold text-white tracking-tight mb-3">
          Confirmed Floor Orders ({confirmedOrders.length})
        </h3>
        {confirmedOrders.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No active orders currently on the floor.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {confirmedOrders.map(order => (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-200">
                    Table {order.tableNumber} · #{order.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      order.orderStatus === 'PREPARING'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : order.orderStatus === 'READY'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {order.orderStatus}
                  </span>
                </div>

                <div className="text-slate-400 truncate">
                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                  <span>Verified by {order.waiterAction?.staffName || 'Staff'}</span>
                  <span className="font-mono text-slate-300">
                    ₹{(order.totalPaise / 100).toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
            <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Reject Request for Table {rejectingOrder.tableNumber}
            </h4>
            <p className="text-xs text-slate-400">
              State the reason why Table {rejectingOrder.tableNumber}'s request #{rejectingOrder.id} cannot be accepted. This reason will be logged and shown to the customer.
            </p>

            <div className="space-y-2">
              {[
                'Table is empty / Phantom QR scan',
                'Guest left the restaurant',
                'Item temporarily out of stock',
                'Kitchen is closed for orders',
              ].map(reason => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    rejectReason === reason
                      ? 'border-rose-500 bg-rose-950/30 text-rose-200'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reject"
                    checked={rejectReason === reason}
                    onChange={() => setRejectReason(reason)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <input
              type="text"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Or write other reason..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
