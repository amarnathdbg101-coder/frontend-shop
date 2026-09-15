import React, { useState, useEffect } from 'react';
import { Search, Check, Layers, ChevronDown, X } from 'lucide-react';
import { apiClient } from '../../api/client';

export function CategorySelector({ selectedCategoryId, onSelectCategory, placeholder = "Select product category..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/categories');
      const raw = res.data?.data || res.data || [];
      setCategories(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.warn('[CategorySelector] Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId || c.slug === selectedCategoryId);
  const filteredCategories = categories.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full">
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium shadow-sm hover:border-purple-500 transition"
      >
        <div className="flex items-center gap-2.5 truncate">
          <Layers size={16} className="text-purple-600 flex-shrink-0" />
          <span className="truncate">{selectedCategory ? selectedCategory.name : placeholder}</span>
        </div>
        <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
      </button>

      {/* Modal / Dropdown Picker */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Choose Product Category</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 gap-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400"
                  placeholder="Search 24+ retail categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-4 flex flex-col gap-1.5">
              {loading ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">Loading categories...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">No categories found matching "{search}".</div>
              ) : (
                filteredCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id || selectedCategoryId === cat.slug;
                  return (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold transition ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
