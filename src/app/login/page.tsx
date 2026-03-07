"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { Camera, Loader2, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const { user, loading, error, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-warm-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-warm-white via-cream to-warm-white flex items-center justify-center p-4">
            {/* Декоративні елементи */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-terracotta/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
                <div className="absolute top-1/3 left-1/4 w-60 h-60 rounded-full bg-olive/5 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-md"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-terracotta/10 border border-white/50 p-8 sm:p-10">
                    {/* Логотип */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-terracotta to-gold mx-auto mb-6 flex items-center justify-center shadow-lg"
                        >
                            <Camera className="w-10 h-10 text-white" />
                        </motion.div>

                        <h1 className="font-serif text-3xl font-bold text-text-dark mb-2">
                            {APP_NAME}
                        </h1>
                        <p className="text-text-muted flex items-center justify-center gap-1.5">
                            <Heart className="w-4 h-4 text-terracotta" />
                            {APP_DESCRIPTION}
                        </p>
                    </div>

                    {/* Декоративна лінія */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
                        <span className="text-xs text-text-light font-medium uppercase tracking-wider">
                            Вхід до архіву
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
                    </div>

                    {/* Помилка або Статус Очікування */}
                    {error === "pending" ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-6 rounded-2xl bg-gold/10 border border-gold/30 text-center"
                        >
                            <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
                            <h3 className="font-medium text-text-dark mb-1">Заявка на розгляді</h3>
                            <p className="text-sm text-text-muted">
                                Ваша заявка відправлена адміністратору. Зачекайте, поки він надасть вам доступ до родинного архіву.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 text-sm text-terracotta font-medium hover:bg-gold/10 rounded-lg transition-colors"
                            >
                                Перевірити статус
                            </button>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    ) : null}

                    {/* Кнопка Google Sign-In (Ховаємо, якщо статус pending) */}
                    {error !== "pending" && (
                        <button
                            onClick={signInWithGoogle}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl
                           bg-white border-2 border-border
                           hover:border-terracotta/30 hover:shadow-lg hover:-translate-y-0.5
                           active:translate-y-0
                           transition-all duration-300 group"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span className="font-medium text-text-dark group-hover:text-terracotta transition-colors">
                                Увійти через Google
                            </span>
                        </button>
                    )}

                    {/* Підказка */}
                    <p className="text-xs text-text-light text-center mt-6 leading-relaxed">
                        Доступ лише для членів родини.
                        <br />
                        Використовуйте ваш Google акаунт для входу.
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-text-light mt-6">
                    Зроблено з <Heart className="w-3 h-3 text-terracotta inline" /> для нашої родини
                </p>
            </motion.div>
        </div>
    );
}
