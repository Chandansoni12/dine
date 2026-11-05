import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantOrder, PaymentMethod } from '../../types/restaurant';
import {
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  CheckCircle,
  Search,
  Printer,
  X,
  Award,
  ShieldCheck,
} from 'lucide-react';
import QRCode from 'qrcode';
import { RESTAURANT_INFO } from '../../data/seedData';

export const CashierView: React.FC = () => {
  const { orders, recordPayment, activeStaff } = useRestaurant();
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [searchTable, setSearchTable] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [activeTender, setActiveTender] = useState<PaymentMethod>('UPI');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [receiptModalOrder, setReceiptModalOrder] = useState<RestaurantOrder | null>(null);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (selectedOrder && activeTender === 'UPI') {
      const amountRupees = (selectedOrder.totalPaise / 100).toFixed(2);
      const upiUrl = `upi://pay?pa=saffronbistro@upi&pn=Saffron+Bistro&am=${amountRupees}&tr=${selectedOrder.id}&cu=INR`;
      QRCode.toDataURL(upiUrl, { width: 240, margin: 1, errorCorrectionLevel: 'M' }, (err, url) => {
        if (!err && url) setUpiQrDataUrl(url);
      });
    }
  }, [selectedOrder, activeTender]);

  const filteredOrders = orders.filter(o => {
    if (filter === 'unpaid' && o.paymentStatus === 'PAID') return false;
    if (filter === 'paid' && o.paymentStatus !== 'PAID') return false;
    if (searchTable.trim()) {
      return (
        o.tableNumber.includes(searchTable.trim()) ||
        o.id.toLowerCase().includes(searchTable.toLowerCase()) ||
        o.customerPhone.includes(searchTable)
      );
    }
    return true;
  });

  const handleRecordPayment = (order: RestaurantOrder) => {
    recordPayment(order.id, activeTender, activeStaff?.id || 'ST-C01');
    setSelectedOrder(null);
    setCashTendered('');
    // Open receipt modal
    const updated = {
      ...order,
      paymentStatus: 'PAID' as const,
      paymentMethod: activeTender,
    };
    setReceiptModalOrder(updated);
  };

  return (
    <div className="space-y-6">
      {/* Cashier Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Cashier & Billing Terminal (Screen 11)
            </h3>
            <p className="text-xs text-slate-400">
              Counter Settlement · Multi-Tender Reconciliation · Verified Stamp Awards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTable}
              onChange={e => setSearchTable(e.target.value)}
              placeholder="Filter Table # / Order #..."
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filter === 'unpaid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filter === 'paid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Blueprint Important Rule Notice */}
      <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl flex items-center gap-2.5 text-xs text-amber-200">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-white">Blueprint Integrity Rule: </strong>
          Order and payment states are strictly decoupled. Diners dine first, and payments are reconciled separately via cash, UPI, or card before loyalty stamps are credited.
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Order / Table</th>
                <th className="py-3 px-4">Diner Details</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-right">Bill Total</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No orders found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-black text-white bg-slate-800 px-2 py-0.5 rounded text-xs">
                        T-{order.tableNumber}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">#{order.id}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-200">{order.customerName || 'Walk-in Diner'}</div>
                      <div className="text-[11px] font-mono text-slate-400">{order.customerPhone}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.orderStatus === 'WAITING_FOR_WAITER'
                            ? 'bg-amber-500/20 text-amber-300'
                            : order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PREPARING'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : order.orderStatus === 'READY'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-amber-300">
                      ₹{(order.totalPaise / 100).toFixed(0)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {order.paymentStatus === 'PAID' ? (
                        <button
                          onClick={() => setReceiptModalOrder(order)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setCashTendered('');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all inline-flex items-center gap-1"
                        >
                          <span>Settle Bill</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Bill Settlement
                </span>
                <h4 className="text-base font-bold">
                  Table {selectedOrder.tableNumber} · #{selectedOrder.id}
                </h4>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bill Summary */}
            <div className="p-3 bg-slate-950 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({selectedOrder.items.length} items)</span>
                <span className="font-mono">₹{(selectedOrder.subtotalPaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (5%)</span>
                <span className="font-mono">₹{(selectedOrder.taxPaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Amount Due</span>
                <span className="font-mono text-emerald-400">
                  ₹{(selectedOrder.totalPaise / 100).toFixed(0)}
                </span>
              </div>
            </div>

            {/* Multi-Tender Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Tender Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTender('UPI')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    activeTender === 'UPI'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs font-bold">UPI QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTender('CASH')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    activeTender === 'CASH'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs font-bold">Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTender('CARD')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    activeTender === 'CARD'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-bold">Card EDC</span>
                </button>
              </div>
            </div>

            {/* Tender Specifics */}
            {activeTender === 'UPI' && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-md">
                  {upiQrDataUrl ? (
                    <img src={upiQrDataUrl} alt="Dynamic UPI QR" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white text-[9px] font-mono text-center p-1 rounded">
                      <QrCode className="w-10 h-10 mb-1 text-emerald-400" />
                      <span>Generating QR...</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-400 font-mono">
                    Exact Payable: ₹{(selectedOrder.totalPaise / 100).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scan with Google Pay, PhonePe, or Paytm (UPI: saffronbistro@upi)
                  </p>
                </div>
              </div>
            )}

            {activeTender === 'CASH' && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cash Received:</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    placeholder={`e.g. ${Math.ceil(selectedOrder.totalPaise / 10000) * 100}`}
                    className="w-28 p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-white text-sm"
                  />
                </div>
                {Number(cashTendered) > selectedOrder.totalPaise / 100 && (
                  <div className="flex justify-between items-center text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <span>Change Due to Diner:</span>
                    <span className="font-mono">
                      ₹{(Number(cashTendered) - selectedOrder.totalPaise / 100).toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Loyalty Trigger Note */}
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-900/50 rounded-xl flex items-center gap-2 text-[11px] text-emerald-200">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Recording payment will automatically credit 1 stamp to {selectedOrder.customerPhone}.
              </span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRecordPayment(selectedOrder)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
              >
                Confirm Payment & Close Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Bill Receipt Snapshot Modal */}
      {receiptModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 text-slate-900 shadow-2xl font-mono text-xs space-y-3">
            <button
              onClick={() => setReceiptModalOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-bold text-base tracking-tight">{RESTAURANT_INFO.name}</h3>
              <p className="text-[10px] text-slate-500">{RESTAURANT_INFO.address}</p>
              <p className="text-[10px] text-slate-500">GSTIN: {RESTAURANT_INFO.gstNumber}</p>
              <div className="mt-1 font-bold text-slate-800">TAX INVOICE · PAID</div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Bill #{receiptModalOrder.id}</span>
              <span>Table {receiptModalOrder.tableNumber}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Date: {new Date(receiptModalOrder.createdAt).toLocaleString()}
            </div>

            {/* Line items */}
            <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
              {receiptModalOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {it.quantity}x {it.name}
                  </span>
                  <span>₹{(it.totalPricePaise / 100).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1 text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{(receiptModalOrder.subtotalPaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (2.5%)</span>
                <span>₹{(receiptModalOrder.taxPaise / 200).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%)</span>
                <span>₹{(receiptModalOrder.taxPaise / 200).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Paid ({receiptModalOrder.paymentMethod})</span>
                <span>₹{(receiptModalOrder.totalPaise / 100).toFixed(0)}</span>
              </div>
            </div>

            <div className="text-center pt-3 text-[10px] text-slate-500 border-t border-dashed border-slate-300">
              <p>Cashier: {receiptModalOrder.cashierAction?.cashierName || 'Cashier Desk'}</p>
              <p className="mt-0.5 text-emerald-700 font-bold">1 Stamp Earned on this Order!</p>
              <p className="mt-1 text-slate-400">Thank you for dining with us!</p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setReceiptModalOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
