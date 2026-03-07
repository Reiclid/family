"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState("");

    // Debounce пошуку для оптимізації
    const debounce = useCallback(
        (fn: (q: string) => void, delay: number) => {
            let timer: NodeJS.Timeout;
            return (q: string) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(q), delay);
            };
        },
        []
    );

    const debouncedSearch = useCallback(
        debounce((q: string) => onSearch(q), 300),
        [onSearch]
    );

    useEffect(() => {
        debouncedSearch(query);
    }, [query, debouncedSearch]);

    const clearSearch = () => {
        setQuery("");
        onSearch("");
    };

    return (
        <div className="relative w-full max-w-xl mx-auto">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-terracotta transition-colors" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Шукати за тегами, описом, роком, людьми..."
                    className="w-full pl-12 pr-12 py-3.5 bg-white rounded-2xl border border-border 
                     text-text-dark placeholder:text-text-light
                     focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta
                     shadow-sm hover:shadow-md focus:shadow-md transition-all
                     text-sm"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-muted hover:text-terracotta hover:bg-cream transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
