import React, { useState, useEffect } from "react";
import { Search, Sparkles, X, History, ArrowRight } from "lucide-react";
import { apiClient } from "../api/client";

export function SmartSearchWidget({ onSelectProduct, onClose }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("shopsilo_merchant_recent_searches");
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch { /* */ }
    }
  }, []);

  const handleSearchChange = async (text) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.get(`/shops/me/products?q=${encodeURIComponent(text)}`);
      const raw = res.data?.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.products) ? raw.products : [];
      setSuggestions(list);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (product) => {
    const updated = [product.name || product.title, ...recentSearches.filter(s => s !== (product.name || product.title))].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem("shopsilo_merchant_recent_searches", JSON.stringify(updated));
    onSelectProduct(product);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-16 px-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search size={20} className="text-purple-600" />
          <input
            type="text"
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none text-base font-medium"
            placeholder="Search store inventory, SKU or barcode..."
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} className="text-slate-400" />
            </button>
          )}
          <button onClick={onClose} className="text-sm font-bold text-purple-600 hover:underline">
            Cancel
          </button>
        </div>

        {/* AI Smart Feature Banner */}
        <div className="bg-purple-50 dark:bg-purple-950/30 px-4 py-2.5 flex items-center gap-2 border-b border-purple-100 dark:border-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold">
          <Sparkles size={14} />
          <span>Merchant Inventory Quick Search &amp; Barcode Matcher Active</span>
        </div>

        {/* Results / History Container */}
        <div className="max-h-96 overflow-y-auto p-4 flex flex-col gap-2">
          {query.trim().length === 0 && recentSearches.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-2">
                <History size={13} />
                <span>RECENT SEARCHES</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearchChange(term)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="py-8 text-center text-xs font-semibold text-slate-400 animate-pulse">
              Searching warehouse inventory...
            </div>
          )}

          {!isLoading && suggestions.map((prod) => (
            <div
              key={prod.id}
              onClick={() => handleSelect(prod)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden font-bold text-purple-600">
                  {prod.images?.[0] || prod.image_url ? (
                    <img src={prod.images?.[0] || prod.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{prod.name || prod.title}</h4>
                  <p className="text-xs text-slate-500">SKU: {prod.sku || "N/A"} • Stock: {prod.stock_quantity ?? prod.stock ?? 0}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className="text-sm font-black text-emerald-600">₹{prod.price}</span>
                <ArrowRight size={16} className="text-slate-400" />
              </div>
            </div>
          ))}

          {!isLoading && query.trim().length > 1 && suggestions.length === 0 && (
            <div className="py-12 text-center text-sm font-semibold text-slate-400">
              No inventory items found matching "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
