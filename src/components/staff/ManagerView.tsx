import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RESTAURANT_TABLES, RESTAURANT_INFO } from '../../data/seedData';
import {
  QrCode,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Clock,
  Printer,
  ExternalLink,
  ShieldAlert,
  Award,
  RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';

export const ManagerView: React.FC = () => {
  const {
    orders,
    loyaltyAccounts,
    setCurrentTable,
    setIsStaffPortalOpen,
    resetDemoData,
    menuItems,
    toggleMenuItemAvailability,
  } = useRestaurant();
  const [selectedTableForQr, setSelectedTableForQr] = useState<string>('08');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Calculate high-level KPIs
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const totalRevenuePaise = paidOrders.reduce((acc, curr) => acc + curr.totalPaise, 0);
  const activeOrdersCount = orders.filter(
    o => o.orderStatus !== 'SERVED' && o.orderStatus !== 'REJECTED'
  ).length;

  const totalLoyaltyMembers = Object.keys(loyaltyAccounts).length;
  const [qrMode, setQrMode] = useState<'table' | 'master'>('table');
  const [publicBaseUrl, setPublicBaseUrl] = useState('https://modify-purchases-verse-edward.trycloudflare.com');

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        if (d.cloudflareTunnelUrl) setPublicBaseUrl(d.cloudflareTunnelUrl);
        else if (d.sharedAppUrl) setPublicBaseUrl(d.sharedAppUrl);
      })
      .catch(() => {});
  }, []);

  // Generate QR code whenever selectedTableForQr or qrMode changes
  useEffect(() => {
    const tableUrl =
      qrMode === 'table'
        ? `${publicBaseUrl.replace(/\/$/, '')}?table=${selectedTableForQr}`
        : `${publicBaseUrl.replace(/\/$/, '')}`;

    QRCode.toDataURL(
      tableUrl,
      {
        width: 340,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [selectedTableForQr, qrMode, publicBaseUrl]);

  const handleTestScanTable = (tableNumber: string) => {
    setCurrentTable(tableNumber);
    setIsStaffPortalOpen(false); // Switch to customer view as this table!
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Today's Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ₹{(totalRevenuePaise / 100).toFixed(0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {paidOrders.length} settled bills today
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Live Orders</span>
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {activeOrdersCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across dining hall & terrace
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Loyalty Diners</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {totalLoyaltyMembers}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Digital stamp wallets active
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Waiter Verification</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            42s
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Request to floor confirmation
          </div>
        </div>
      </div>

      {/* Blueprint Integrity Concept Callout */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Blueprint Page 18: QR Code Integrity Architecture</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          A static QR code can be photographed or forwarded outside the restaurant. Our platform prevents unauthorized orders through a three-layer defense:
          <strong> 1) Table-specific revocable mapping</strong>,
          <strong> 2) State holds at WAITING_FOR_WAITER</strong>, and
          <strong> 3) Floor staff mandatory physical verification before kitchen ticket generation</strong>.
        </p>
      </div>

      {/* Table QR Generator & Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table Selection Grid */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Table QR Management (12 Tables)
              </h3>
              <p className="text-xs text-slate-400">
                Click a table to preview, generate its printable QR stand, or simulate customer scanning
              </p>
            </div>
            <button
              onClick={resetDemoData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Reset all demo orders & data to seed state"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {RESTAURANT_TABLES.map(table => {
              const isSelected = selectedTableForQr === table.tableNumber;
              const hasActiveOrder = orders.some(
                o => o.tableNumber === table.tableNumber && o.orderStatus !== 'SERVED'
              );

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableForQr(table.tableNumber)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-black text-sm text-white">
                      T-{table.tableNumber}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hasActiveOrder ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`}
                      title={hasActiveOrder ? 'Active Dining Session' : 'Available'}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{table.section}</div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{table.capacity} Seats</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleTestScanTable(table.tableNumber);
                      }}
                      className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-0.5"
                      title={`Simulate customer scanning Table ${table.tableNumber}`}
                    >
                      <span>Scan</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Printable QR Stand Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between shadow-lg">
          <div className="text-center w-full">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
              Printable Acrylic Standee
            </span>
            <h4 className="text-base font-bold text-white mt-0.5">
              {qrMode === 'table' ? `Table ${selectedTableForQr} QR Stand` : 'Master Restaurant QR'}
            </h4>
            
            {/* Mode Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mt-2 text-xs">
              <button
                type="button"
                onClick={() => setQrMode('table')}
                className={`flex-1 py-1 rounded-lg font-bold transition-colors ${
                  qrMode === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table {selectedTableForQr}
              </button>
              <button
                type="button"
                onClick={() => setQrMode('master')}
                className={`flex-1 py-1 rounded-lg font-bold transition-colors ${
                  qrMode === 'master' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Master (All Tables)
              </button>
            </div>
          </div>

          {/* Stand Mockup Card */}
          <div className="my-4 bg-white text-slate-900 rounded-2xl p-5 text-center shadow-xl border-4 border-slate-800 max-w-[260px] w-full">
            <div className="font-bold text-sm text-amber-900 tracking-tight">
              {RESTAURANT_INFO.name}
            </div>
            <div className="text-[10px] text-slate-500 mb-2">Scan for Menu, Order & Rewards</div>

            {/* Generated QR Code */}
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Table ${selectedTableForQr} QR Code`}
                className="w-48 h-48 mx-auto rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                Generating QR...
              </div>
            )}

            <div className="mt-2 font-mono font-black text-xl tracking-wider text-slate-950">
              TABLE {selectedTableForQr}
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
              Dine-In Orders Verified by Waiter
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <button
              onClick={() => handleTestScanTable(selectedTableForQr)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Simulate Customer Scan (Table {selectedTableForQr})</span>
            </button>
            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Table Standee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live 86 / Stock-Out Controls (Screen 12 Operational Enhancement) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>Kitchen & Bar Stock-out Controls (86 Management)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Toggle dishes when ingredients run out. Updates all customer digital menus in real-time.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {menuItems.filter(m => m.isAvailable !== false).length} / {menuItems.length} In Stock
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {menuItems.map(item => {
            const inStock = item.isAvailable !== false;
            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  inStock
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-rose-950/20 border-rose-900/60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        inStock ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                    />
                    <h5 className="font-bold text-xs text-white truncate">{item.name}</h5>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                    <span className="capitalize">{item.category}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-300">₹{(item.pricePaise / 100).toFixed(0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleMenuItemAvailability(item.id, !inStock)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    inStock
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-rose-500/20 hover:text-rose-300 border border-emerald-500/30'
                      : 'bg-rose-600 text-white hover:bg-emerald-600'
                  }`}
                  title={inStock ? 'Click to 86 / Mark Sold Out' : 'Click to Restock'}
                >
                  {inStock ? 'In Stock' : "86'd"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
