import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RESTAURANT_INFO } from '../../data/seedData';
import {
  X,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Printer,
  Smartphone,
  Sparkles,
  HelpCircle,
  Globe,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import QRCode from 'qrcode';

interface TableQrStandeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PUBLIC_URL = 'https://modify-purchases-verse-edward.trycloudflare.com';

export const TableQrStandeeModal: React.FC<TableQrStandeeModalProps> = ({ isOpen, onClose }) => {
  const { currentTable, setCurrentTable } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState(currentTable);
  const [qrMode, setQrMode] = useState<'table_specific' | 'master_restaurant'>('table_specific');
  const [baseUrlSource, setBaseUrlSource] = useState<'cloud' | 'wifi' | 'localhost' | 'custom'>('cloud');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [detectedSharedUrl, setDetectedSharedUrl] = useState(DEFAULT_PUBLIC_URL);
  const [wifiIpUrl, setWifiIpUrl] = useState('http://10.70.11.66:3000');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showArchExplanation, setShowArchExplanation] = useState(false);

  // Fetch backend config on mount to get Cloudflare tunnel & local Wi-Fi IP
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (data.cloudflareTunnelUrl) setDetectedSharedUrl(data.cloudflareTunnelUrl);
        else if (data.sharedAppUrl) setDetectedSharedUrl(data.sharedAppUrl);
        if (data.localNetworkUrl) setWifiIpUrl(data.localNetworkUrl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedTable(currentTable);
  }, [currentTable]);

  // Compute final base URL
  const activeBaseUrl = (() => {
    if (baseUrlSource === 'cloud') return detectedSharedUrl;
    if (baseUrlSource === 'wifi') return wifiIpUrl;
    if (baseUrlSource === 'custom' && customBaseUrl.trim()) return customBaseUrl.trim();
    if (baseUrlSource === 'localhost' && typeof window !== 'undefined') {
      return `${window.location.origin}`;
    }
    return detectedSharedUrl;
  })();

  // Compute final table URL
  const tableUrl =
    qrMode === 'table_specific'
      ? `${activeBaseUrl.replace(/\/$/, '')}?table=${selectedTable}`
      : `${activeBaseUrl.replace(/\/$/, '')}`;

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(
      tableUrl,
      {
        width: 380,
        margin: 2,
        errorCorrectionLevel: 'H', // High error correction for reliable phone camera scanning
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
  }, [tableUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectTable = (tbl: string) => {
    setSelectedTable(tbl);
    setCurrentTable(tbl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">QR Code Generator & Phone Access</h3>
              <p className="text-xs text-slate-400">Scannable by any mobile camera or QR scanner</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Network Selection Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950">
            <div className="flex items-start gap-2.5">
              <Smartphone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Mobile Phone Scanning Target</span>
                  <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">
                    {baseUrlSource === 'cloud' ? 'Direct Cloudflare HTTPS' : baseUrlSource === 'wifi' ? 'Local Wi-Fi IP' : baseUrlSource === 'localhost' ? 'Localhost' : 'Custom'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  {baseUrlSource === 'cloud' ? (
                    <>
                      Encodes <strong>{detectedSharedUrl}</strong>. Works <strong>instantly on any phone</strong> (iOS/Android) over Wi-Fi, 4G, or 5G with no firewall or isolation blocks!
                    </>
                  ) : baseUrlSource === 'wifi' ? (
                    <>
                      Encodes your local Wi-Fi IP (<strong>{wifiIpUrl}</strong>). Requires your phone on the same Wi-Fi without router AP isolation.
                    </>
                  ) : baseUrlSource === 'localhost' ? (
                    <>
                      Encodes <strong>http://localhost:3000</strong>. Use this when testing in PC desktop browser tabs.
                    </>
                  ) : (
                    <>
                      Encodes your custom public tunnel (ngrok / live domain) for external testing.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Target Switcher Tabs */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-emerald-200/80">
              <button
                type="button"
                onClick={() => setBaseUrlSource('cloud')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  baseUrlSource === 'cloud'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Direct Cloud (All Phones)
              </button>
              <button
                type="button"
                onClick={() => setBaseUrlSource('wifi')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  baseUrlSource === 'wifi'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Local Wi-Fi
              </button>
              <button
                type="button"
                onClick={() => setBaseUrlSource('localhost')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  baseUrlSource === 'localhost'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Localhost (PC)
              </button>
            </div>

            {baseUrlSource === 'custom' && (
              <div className="pt-1.5">
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={e => setCustomBaseUrl(e.target.value)}
                  placeholder="https://your-ngrok-or-domain.app"
                  className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Key Answer 2: Table-Specific QR vs One QR for All Tables */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Choose QR Architecture
              </span>
              <button
                type="button"
                onClick={() => setShowArchExplanation(s => !s)}
                className="text-[11px] text-amber-700 font-semibold hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Do we need each table QR or one QR?</span>
              </button>
            </div>

            {/* Architecture Explanation Drawer */}
            {showArchExplanation && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2 animate-fade-in">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>How Both Approaches Work:</span>
                </div>
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <p>
                    <strong>1. Table-Specific QR (Recommended by Blueprint):</strong> Each table has a unique sticker (Table 01, Table 02, etc.). When a diner scans, the app <em>instantly knows their exact table</em>. No typing, no friction, and zero order mistakes.
                  </p>
                  <p>
                    <strong>2. One Universal Master QR for All Tables:</strong> You print just ONE single QR poster for the entire restaurant. When diners scan it, the app asks: <em>"Which table are you seated at?"</em>. Diners tap their table number to begin.
                  </p>
                  <p className="text-amber-800 font-medium pt-1 border-t border-amber-200">
                    💡 Our platform supports <strong>both</strong>! Toggle below to switch between Table-Specific QR and Universal Master QR.
                  </p>
                </div>
              </div>
            )}

            {/* Toggle Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQrMode('table_specific')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  qrMode === 'table_specific'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Table-Specific QR</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal">
                  Auto-detects Table {selectedTable} upon scan
                </p>
              </button>

              <button
                type="button"
                onClick={() => setQrMode('master_restaurant')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  qrMode === 'master_restaurant'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>One Master QR</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal">
                  Diner selects table upon scanning
                </p>
              </button>
            </div>
          </div>

          {/* Table Selector (only shown if in table-specific mode) */}
          {qrMode === 'table_specific' && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Generate for Specific Table
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(tbl => (
                  <button
                    key={tbl}
                    onClick={() => handleSelectTable(tbl)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      selectedTable === tbl
                        ? 'bg-amber-500 text-slate-950 shadow-xs scale-105'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    T-{tbl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Printable Standee Display Box */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 max-w-[310px] mx-auto shadow-inner text-slate-900 text-center space-y-2">
            <div className="text-xs font-black uppercase tracking-widest text-amber-800">
              {RESTAURANT_INFO.name}
            </div>
            <p className="text-[10px] text-slate-500">Scan to Order, Pay & Earn Stamps</p>

            {/* Generated QR Image */}
            <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scannable Table QR Code"
                  className="w-52 h-52 mx-auto"
                />
              ) : (
                <div className="w-52 h-52 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Generating High-Res QR...
                </div>
              )}
            </div>

            <div className="font-mono font-black text-2xl tracking-wider text-slate-950 pt-1">
              {qrMode === 'table_specific' ? `TABLE ${selectedTable}` : 'DINE-IN ORDERING'}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              {qrMode === 'table_specific'
                ? 'Orders Verified in Person by Waiter'
                : 'Universal Restaurant QR Standee'}
            </div>
          </div>

          {/* URL & Connection Info */}
          <div className="p-3 bg-slate-100 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="font-semibold">Target Scanned URL:</span>
              <span className="font-mono text-[10px] text-emerald-700 font-bold">Public URL Active</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 truncate select-all">
              {tableUrl}
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Mobile Link'}</span>
              </button>

              <a
                href={tableUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Test in New Tab</span>
              </a>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Standee Acrylic Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
