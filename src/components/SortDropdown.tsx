"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SortDropdownProps {
    sortBy: 'date' | 'name';
    setSortBy: (val: 'date' | 'name') => void;
}

export default function SortDropdown({ sortBy, setSortBy }: SortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Закриваємо при кліку поза елементом
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const options = [
        { value: 'date', label: 'Спочатку нові' },
        { value: 'name', label: 'За назвою (А-Я)' }
    ];

    const currentOption = options.find(o => o.value === sortBy);

    return (
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full sm:w-[200px] flex items-center justify-between px-4 py-3 rounded-2xl border bg-white text-sm font-medium transition-all duration-300 outline-none
          ${isOpen ? 'border-terracotta/50 ring-2 ring-terracotta/20 shadow-md' : 'border-border text-text-dark hover:border-gold/50 shadow-sm'}
        `}
            >
                <span className="truncate">{currentOption?.label}</span>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Випадаючий список */}
            <div
                className={`absolute z-[100] mt-2 w-full min-w-[200px] left-0 md:left-auto md:right-0 bg-white border border-border rounded-xl shadow-xl overflow-hidden transition-all duration-200 transform origin-top
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
        `}
            >
                <div className="py-1.5 flex flex-col">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                setSortBy(option.value as 'date' | 'name');
                                setIsOpen(false);
                            }}
                            className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left
                ${sortBy === option.value
                                    ? 'bg-gold/10 text-terracotta font-medium'
                                    : 'text-text-dark hover:bg-black/5'
                                }
              `}
                        >
                            <span className="truncate">{option.label}</span>
                            {sortBy === option.value && <Check className="w-4 h-4 text-terracotta shrink-0 ml-2" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
