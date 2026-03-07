"use client";

import { useAuth } from "@/context/AuthContext";
import { APP_NAME } from "@/lib/constants";
import { ADMIN_CONFIG } from "@/config/admin";
import { LogOut, Upload, Camera, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SyncButton from "./SyncButton";
import Image from "next/image";

export default function Header() {
    const { user, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!user) return null;

    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-warm-white/80 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Логотип */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta to-gold flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-serif text-xl font-bold text-text-dark tracking-tight">
                                {APP_NAME}
                            </h1>
                            <p className="text-xs text-text-muted -mt-0.5 hidden sm:block">
                                Спогади назавжди
                            </p>
                        </div>
                    </Link>

                    {/* Desktop навігація */}
                    <nav className="hidden md:flex items-center gap-2">
                        <Link
                            href="/"
                            className="px-4 py-2 rounded-lg text-sm font-medium text-text-dark hover:bg-cream transition-colors"
                        >
                            Галерея
                        </Link>

                        {user.email === ADMIN_CONFIG.email && (
                            <>
                                <div className="hidden lg:block border-r border-border h-6 mx-1"></div>
                                <SyncButton />
                                <Link
                                    href="/admin"
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-dark hover:bg-cream transition-colors"
                                >
                                    Налаштування
                                </Link>
                            </>
                        )}

                        {/* Профіль */}
                        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
                            {user.photoURL && (
                                <Image
                                    src={user.photoURL}
                                    alt={user.displayName || ""}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full ring-2 ring-gold/30"
                                />
                            )}
                            <div className="hidden lg:block">
                                <p className="text-sm font-medium text-text-dark leading-tight">
                                    {user.displayName}
                                </p>
                                <p className="text-xs text-text-muted">{user.email}</p>
                            </div>
                            <button
                                onClick={signOut}
                                className="p-2 rounded-lg text-text-muted hover:text-terracotta hover:bg-cream transition-colors"
                                title="Вийти"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </nav>

                    {/* Мобільне меню кнопка */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-text-dark hover:bg-cream transition-colors"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Мобільне меню */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden overflow-hidden border-t border-border bg-warm-white"
                    >
                        <div className="px-4 py-4 space-y-2">
                            <div className="flex items-center gap-3 pb-3 border-b border-border">
                                {user.photoURL && (
                                    <Image
                                        src={user.photoURL}
                                        alt={user.displayName || ""}
                                        width={40}
                                        height={40}
                                        className="w-10 h-10 rounded-full ring-2 ring-gold/30"
                                    />
                                )}
                                <div>
                                    <p className="font-medium text-text-dark">{user.displayName}</p>
                                    <p className="text-xs text-text-muted">{user.email}</p>
                                </div>
                            </div>

                            <Link
                                href="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-3 rounded-lg text-text-dark hover:bg-cream transition-colors"
                            >
                                Галерея
                            </Link>

                            {user.email === ADMIN_CONFIG.email && (
                                <>
                                    <div className="px-4 pt-2">
                                        <SyncButton />
                                    </div>
                                    <Link
                                        href="/admin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-4 py-3 rounded-lg text-text-dark hover:bg-cream transition-colors"
                                    >
                                        Налаштування
                                    </Link>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    signOut();
                                    setMobileMenuOpen(false);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-text-muted hover:text-terracotta hover:bg-cream transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Вийти
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
