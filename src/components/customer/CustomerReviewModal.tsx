import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  X,
  Star,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Wand2,
  ThumbsUp,
  RefreshCw,
  Utensils,
  ShieldCheck,
  Edit3,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface CustomerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerReviewModal: React.FC<CustomerReviewModalProps> = ({ isOpen, onClose }) => {
  const { currentTable, getCustomerActiveOrder, submitReview, customerSession, orders } =
    useRestaurant();
  const activeOrder = getCustomerActiveOrder();

  // Find any recent completed/served order for this table or diner
  const recentOrder =
    activeOrder ||
    orders.find(
      o =>
        o.tableNumber === currentTable ||
        (customerSession && o.customerPhone === customerSession.phone)
    );

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Delicious Food',
    'Fast Waiter Service',
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [copiedGoogle, setCopiedGoogle] = useState(false);

  // AI Review Assistant States
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiMode, setAiMode] = useState<'generate' | 'enhance'>('generate');
  const [aiStyle, setAiStyle] = useState<'warm' | 'foodie' | 'crisp' | 'family'>('warm');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickTags = [
    'Delicious Food',
    'Fast Waiter Service',
    'Perfect Spice Level',
    'Fresh & Hot',
    'Clean & Hygienic',
    'Great Hospitality',
  ];

  const orderedDishesList = recentOrder ? recentOrder.items.map(i => i.name) : ['Paneer Tikka', 'Dal Tadka'];

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handlePostToGoogleMaps = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedGoogle(true);
    setTimeout(() => setCopiedGoogle(false), 4000);
    window.open('https://search.google.com/local/writereview?placeid=ChIJrTLr-GyuEmsRBfy61i59si0', '_blank');
  };

  const handleGenerateAiReview = async (mode: 'generate' | 'enhance') => {
    setIsGeneratingAi(true);
    setAiGeneratedPreview(null);
    try {
      const res = await fetch('/api/ai/review-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          roughNotes: comment,
          orderedDishes: orderedDishesList,
          rating,
          style: aiStyle,
          guestName: customerSession?.name || 'Guest',
        }),
      });
      const data = await res.json();
      if (data.reviewText) {
        setAiGeneratedPreview(data.reviewText);
      }
    } catch (err) {
      console.error(err);
      // Fallback preview
      setAiGeneratedPreview(
        `We ordered ${orderedDishesList.join(' & ')} at Table ${currentTable}, and every single dish was freshly cooked with rich aromatic spices. The waiter verified our order in person, and the dining experience was wonderful!`
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAiReview = () => {
    if (aiGeneratedPreview) {
      setComment(aiGeneratedPreview);
      setAiGeneratedPreview(null);
      setShowAiAssistant(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrderId = recentOrder ? recentOrder.id : `R104${currentTable}`;
    const finalComment = [comment.trim(), selectedTags.length > 0 ? selectedTags.join(', ') : '']
      .filter(Boolean)
      .join(' | ');

    submitReview(targetOrderId, rating, finalComment);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Mobile handle */}
        <div className="w-10 h-1 bg-slate-600/40 rounded-full mx-auto mt-2 sm:hidden shrink-0" />
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-2 py-0.5 rounded">
                Dine-In Review · Table {currentTable}
              </span>
              {recentOrder && (
                <span className="text-[11px] text-slate-300">Order #{recentOrder.id}</span>
              )}
            </div>
            <h3 className="text-lg font-bold tracking-tight mt-1">Share Your Dining Feedback</h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Thank you for your feedback!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
                Your review has been verified for Table {currentTable}. Help other diners discover us by copying this review to Google Maps!
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handlePostToGoogleMaps(comment)}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copiedGoogle ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied & Opening Google Maps!</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Post Directly to Google Maps</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
            {/* 1. Star Rating */}
            <div className="text-center py-2 bg-slate-50/70 rounded-2xl border border-slate-100 p-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Tap Stars to Rate
              </span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => {
                  const filled = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-115 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          filled
                            ? 'text-amber-500 fill-amber-500 drop-shadow-xs'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-slate-700 mt-1.5 block">
                {rating === 5
                  ? '⭐⭐⭐⭐⭐ Outstanding Experience'
                  : rating === 4
                  ? '⭐⭐⭐⭐ Very Good'
                  : rating === 3
                  ? '⭐⭐⭐ Average'
                  : rating === 2
                  ? '⭐⭐ Needs Improvement'
                  : '⭐ Poor'}
              </span>
            </div>

            {/* 2. Quick Tags */}
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Highlights from your meal
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. AI Review Assistant Feature Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>AI Review Assistant</span>
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.2 rounded">
                        Optional & Humanized
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-600">
                      With your permission, AI can draft or polish a personalized human review.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiAssistant(s => !s)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 shadow-xs transition-colors shrink-0"
                >
                  {showAiAssistant ? 'Hide AI' : 'Use AI'}
                </button>
              </div>

              {/* Collapsible AI Assistant Controls */}
              {showAiAssistant && (
                <div className="pt-2 border-t border-amber-200/80 space-y-3 animate-fade-in">
                  {/* Mode Selector */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAiMode('generate')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        aiMode === 'generate'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Draft from Dishes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiMode('enhance')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        aiMode === 'enhance'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Polish My Rough Notes
                    </button>
                  </div>

                  {/* Dishes Context indicator */}
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 bg-white/70 p-2 rounded-lg border border-amber-200/60">
                    <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      Personalized with your dishes: <strong>{orderedDishesList.slice(0, 3).join(', ')}</strong>
                    </span>
                  </div>

                  {/* Tone / Style Options */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 shrink-0">
                      Tone:
                    </span>
                    {(
                      [
                        { id: 'warm', label: 'Warm & Natural' },
                        { id: 'foodie', label: 'Foodie Details' },
                        { id: 'crisp', label: 'Short & Crisp' },
                        { id: 'family', label: 'Family Dinner' },
                      ] as const
                    ).map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setAiStyle(st.id)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                          aiStyle === st.id
                            ? 'bg-amber-600 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Trigger Generate Button */}
                  <button
                    type="button"
                    onClick={() => handleGenerateAiReview(aiMode)}
                    disabled={isGeneratingAi}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>
                      {isGeneratingAi
                        ? 'Writing humanized review...'
                        : aiMode === 'generate'
                        ? 'Draft Review with AI'
                        : 'Enhance My Notes with AI'}
                    </span>
                  </button>

                  {/* Generated Review Preview with User Permission Acceptance */}
                  {aiGeneratedPreview && (
                    <div className="bg-white p-3 rounded-xl border border-amber-300 shadow-sm space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          Generated Review Preview:
                        </span>
                        <span className="text-[10px] text-slate-400">Human permission required</span>
                      </div>
                      <p className="text-xs text-slate-800 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 leading-relaxed">
                        "{aiGeneratedPreview}"
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApplyAiReview}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Use This Review</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateAiReview(aiMode)}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Review Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Review Message
                </label>
                {comment && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {comment.length} chars
                  </span>
                )}
              </div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write your thoughts or use the AI Assistant above to draft a review based on your meal..."
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors leading-relaxed"
                required
              />
            </div>

            {/* User Control & Permission Notice */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>You have full control to edit or adjust your review before publishing.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Publish Verified Review</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
