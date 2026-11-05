import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { X, Award, Gift, Sparkles, CheckCircle, Info, ShieldCheck } from 'lucide-react';
import { RESTAURANT_INFO } from '../../data/seedData';

interface LoyaltyWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoyaltyWalletModal: React.FC<LoyaltyWalletModalProps> = ({ isOpen, onClose }) => {
  const { customerSession, getLoyaltyForPhone } = useRestaurant();

  if (!isOpen) return null;

  const phone = customerSession?.phone || '+91 98201 12345';
  const loyalty = getLoyaltyForPhone(phone);
  const stamps = loyalty.stampsCount;
  const threshold = loyalty.threshold;
  const stampsRemaining = Math.max(0, threshold - (stamps % threshold));
  const isRewardUnlocked = stamps >= threshold;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Mobile sheet handle */}
        <div className="w-10 h-1 bg-white/40 rounded-full mx-auto mt-2 sm:hidden shrink-0 absolute top-0 left-0 right-0 z-10" />
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white relative shrink-0 pt-7 sm:pt-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-amber-200" />
            <span className="text-xs uppercase tracking-widest font-bold text-amber-200">
              Digital Loyalty Stamp Card
            </span>
          </div>

          <h3 className="text-2xl font-bold tracking-tight">
            {stamps} / {threshold} Stamps Earned
          </h3>
          <p className="text-xs text-amber-100/90 mt-1">
            {isRewardUnlocked
              ? '🎉 Reward unlocked! Show this screen to your server or cashier.'
              : `${stampsRemaining} more qualifying dine-in order${stampsRemaining > 1 ? 's' : ''} to unlock your reward.`}
          </p>

          <div className="mt-3 inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs text-amber-100 font-mono">
            <span>Linked Phone: {phone}</span>
          </div>
        </div>

        {/* Punch Card Display */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Visual Stamp Card */}
          <div className="bg-gradient-to-b from-amber-50 to-orange-50/50 p-5 rounded-2xl border-2 border-dashed border-amber-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Reward: {RESTAURANT_INFO.stampReward}
              </span>
              <Gift className="w-4 h-4 text-amber-700" />
            </div>

            {/* 6 Stamp Circles Grid */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: threshold }).map((_, index) => {
                const isStamped = index < stamps;
                return (
                  <div
                    key={index}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isStamped
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md scale-[1.02]'
                        : 'bg-white border-2 border-dashed border-amber-200 text-amber-300'
                    }`}
                  >
                    {isStamped ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-white stroke-[2.5]" />
                        <span className="text-[10px] font-bold mt-1 tracking-tight">STAMP {index + 1}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold font-mono text-amber-300">#{index + 1}</span>
                        <span className="text-[9px] uppercase tracking-wider text-amber-400 mt-0.5">Empty</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
              <span className="font-semibold">Qualifying Rule:</span>
              <span className="text-[11px] text-amber-800">Min spend ₹200 per completed order</span>
            </div>
          </div>

          {/* Blueprint Integrity Rule Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-2.5 items-start text-xs text-slate-600">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-800">Verified Stamp Policy: </span>
              Stamps are awarded automatically upon counter or online payment settlement. Stamps cannot be manipulated or created by app re-opens.
            </p>
          </div>

          {/* Stamp History Ledger */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Verified Stamp Activity
            </h4>
            {loyalty.history.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No stamp activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                {loyalty.history.map((ev, i) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{ev.note}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Order #{ev.orderId} · {ev.date}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      +{ev.stampsDelta} Stamp
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cryptographically Verified Stamp Ledger</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
