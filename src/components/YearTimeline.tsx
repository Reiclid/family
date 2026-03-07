"use client";

import { motion } from "framer-motion";

interface YearTimelineProps {
    years: number[];
    activeYear: number | null;
    onYearClick: (year: number | null) => void;
}

export default function YearTimeline({ years, activeYear, onYearClick }: YearTimelineProps) {
    if (years.length === 0) return null;

    return (
        <div className="w-full overflow-x-auto scrollbar-hide py-2">
            <div className="flex items-center gap-1.5 min-w-max px-4 justify-center">
                {/* Кнопка "Всі" */}
                <button
                    onClick={() => onYearClick(null)}
                    className={`
            relative px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
            ${activeYear === null
                            ? "text-white"
                            : "text-text-muted hover:text-text-dark hover:bg-cream"
                        }
          `}
                >
                    {activeYear === null && (
                        <motion.div
                            layoutId="activeYear"
                            className="absolute inset-0 bg-gradient-to-r from-terracotta to-gold rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-10">Всі роки</span>
                </button>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Кнопки років */}
                {years.map((year) => (
                    <button
                        key={year}
                        onClick={() => onYearClick(year)}
                        className={`
              relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
              ${activeYear === year
                                ? "text-white"
                                : "text-text-muted hover:text-text-dark hover:bg-cream"
                            }
            `}
                    >
                        {activeYear === year && (
                            <motion.div
                                layoutId="activeYear"
                                className="absolute inset-0 bg-gradient-to-r from-terracotta to-gold rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{year}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
