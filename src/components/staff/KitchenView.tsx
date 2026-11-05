import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantOrder } from '../../types/restaurant';
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Play,
  Check,
} from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { orders, startPreparingOrder, markOrderReady } = useRestaurant();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [, setTicker] = useState(0);

  // Update timers every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => setTicker(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  // MANDATORY BLUEPRINT RULE (Page 14):
  // "Display ONLY orders confirmed by a waiter or authorized staff.
  // Requests waiting for waiter approval must never appear in the kitchen queue."
  const kitchenTickets = orders.filter(
    ord => ord.orderStatus === 'CONFIRMED' || ord.orderStatus === 'PREPARING'
  );

  const readyTickets = orders.filter(ord => ord.orderStatus === 'READY');

  const toggleCheck = (itemKey: string) => {
    setCheckedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const getElapsedMinutes = (isoString?: string) => {
    if (!isoString) return 0;
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.floor(diffMs / 60000);
  };

  return (
    <div className="space-y-6">
      {/* KDS Header & Rule Verification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">
              Live Cooking Queue · Showing only waiter-confirmed tickets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-mono font-bold">
            {kitchenTickets.length} ACTIVE IN PREP
          </span>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg font-mono font-bold">
            {readyTickets.length} READY ON PASS
          </span>
        </div>
      </div>

      {/* Blueprint Compliance Banner */}
      <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-xl flex items-center gap-2.5 text-xs text-indigo-200">
        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          <strong className="text-white">Strict Kitchen Isolation: </strong>
          Unconfirmed orders in 'WAITING_FOR_WAITER' are strictly prevented from appearing here to eliminate phantom tickets.
        </span>
      </div>

      {/* Active Cooking Tickets Grid */}
      {kitchenTickets.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <ChefHat className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-200">Kitchen Queue is Clear</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Once floor waiters verify customer table requests, confirmed tickets will immediately appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kitchenTickets.map(order => {
            const elapsedMins = getElapsedMinutes(
              order.kitchenAction?.startedAt || order.waiterAction?.confirmedAt || order.createdAt
            );
            const isLate = elapsedMins >= 15;
            const isWarning = elapsedMins >= 10 && !isLate;
            const isPreparing = order.orderStatus === 'PREPARING';

            return (
              <div
                key={order.id}
                className={`bg-slate-900 border-2 rounded-2xl flex flex-col shadow-lg overflow-hidden transition-all ${
                  isLate
                    ? 'border-rose-500/80 shadow-rose-950/40'
                    : isWarning
                    ? 'border-amber-500/80 shadow-amber-950/40'
                    : isPreparing
                    ? 'border-indigo-500/80'
                    : 'border-slate-700'
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-3.5 flex items-center justify-between text-white ${
                    isLate
                      ? 'bg-rose-950/60'
                      : isWarning
                      ? 'bg-amber-950/60'
                      : isPreparing
                      ? 'bg-indigo-950/60'
                      : 'bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg bg-white text-slate-950 px-2.5 py-0.5 rounded-lg">
                      T-{order.tableNumber}
                    </span>
                    <div>
                      <div className="font-mono font-bold text-xs text-slate-200">
                        #{order.id}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Waitstaff: {order.waiterAction?.staffName || 'Floor Staff'}
                      </div>
                    </div>
                  </div>

                  {/* Elapsed Timer */}
                  <div
                    className={`flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                      isLate
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isWarning
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-indigo-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMins} min</span>
                  </div>
                </div>

                {/* Items & Modifiers Checklist */}
                <div className="p-4 flex-1 space-y-3">
                  <div className="space-y-2">
                    {order.items.map((it, idx) => {
                      const itemKey = `${order.id}-${idx}`;
                      const isChecked = Boolean(checkedItems[itemKey]);

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleCheck(itemKey)}
                          className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-slate-950/40 border-slate-800/60 opacity-50 line-through text-slate-500'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                              isChecked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-600 bg-slate-900'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-amber-400 font-mono text-sm">
                                {it.quantity}x
                              </span>
                              <span className="font-bold text-sm text-white truncate">
                                {it.name}
                              </span>
                            </div>

                            {it.selectedPortion && (
                              <p className="text-xs text-indigo-300 font-medium mt-0.5">
                                Portion: {it.selectedPortion}
                              </p>
                            )}

                            {it.selectedAddOns.length > 0 && (
                              <p className="text-[11px] text-slate-400">
                                Add: {it.selectedAddOns.join(', ')}
                              </p>
                            )}

                            {it.notes && (
                              <div className="mt-1 p-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] font-semibold text-amber-300">
                                ⚠️ Note: {it.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Workflow Action */}
                <div className="p-3 bg-slate-950 border-t border-slate-800">
                  {order.orderStatus === 'CONFIRMED' ? (
                    <button
                      onClick={() => startPreparingOrder(order.id)}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>START PREPARING TICKET</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => markOrderReady(order.id)}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MARK ORDER READY ON PASS</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ready Orders on Pass */}
      {readyTickets.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Ready for Waiter Pickup</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono">
                {readyTickets.length}
              </span>
            </h3>
            <span className="text-xs text-slate-400">At Kitchen Pass</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {readyTickets.map(order => (
              <div
                key={order.id}
                className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-300">
                    Table {order.tableNumber} · Order #{order.id}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">
                    PLATED ON PASS
                  </span>
                </div>
                <div className="text-slate-300 truncate">
                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
                <div className="text-[11px] text-slate-500">
                  Ready since {new Date(order.kitchenAction?.readyAt || order.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
