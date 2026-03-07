"use client";

import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import UploadForm from "@/components/UploadForm";

export default function UploadPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-warm-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-warm-white">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Хлібні крихти */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-terracotta transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Назад до галереї
                </Link>

                {/* Заголовок */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-terracotta to-gold mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <Upload className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-text-dark mb-2">
                        Додати фото до архіву
                    </h1>
                    <p className="text-text-muted max-w-md mx-auto">
                        Завантажте нові сімейні фото. Додайте опис та теги, щоб їх було легко знайти.
                    </p>
                </div>

                {/* Форма завантаження */}
                <UploadForm />
            </main>
        </div>
    );
}
