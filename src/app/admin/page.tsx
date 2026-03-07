"use client";

import { useAuth } from "@/context/AuthContext";
import { ADMIN_CONFIG } from "@/config/admin";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, ShieldCheck, AlertCircle, Check, X as XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [emails, setEmails] = useState<string[]>([]);
    const [requests, setRequests] = useState<{ email: string, displayName: string, timestamp: string }[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || user.email !== ADMIN_CONFIG.email)) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Завантажуємо білий список
            const settingsDoc = await getDoc(doc(db, "settings", "whitelist"));
            if (settingsDoc.exists()) {
                setEmails(settingsDoc.data().emails || []);
            }

            // Завантажуємо заявки на розгляд
            const reqSnapshot = await getDocs(collection(db, "access_requests"));
            const pendingReqs = reqSnapshot.docs.map(d => d.data() as any).filter(r => r.status === "pending");

            // Сортуємо від нових до старих
            pendingReqs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setRequests(pendingReqs);

        } catch (err) {
            console.error("Error fetching admin data", err);
            setError("Помилка завантаження даних.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user && user.email === ADMIN_CONFIG.email) {
            fetchData();
        }
    }, [user, fetchData]);

    const handleAddEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!newEmail || !newEmail.includes("@")) {
            setError("Будь ласка, введіть коректний email.");
            return;
        }

        if (emails.includes(newEmail)) {
            setError("Цей email вже є у списку.");
            return;
        }

        try {
            const updatedEmails = [...emails, newEmail];
            await setDoc(doc(db, "settings", "whitelist"), { emails: updatedEmails }, { merge: true });
            setEmails(updatedEmails);
            setNewEmail("");
            setSuccess("Email успішно додано.");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Error adding email", err);
            setError("Помилка при додаванні email.");
        }
    };

    const handleRemoveEmail = async (emailToRemove: string) => {
        if (!confirm(`Ви впевнені, що хочете видалити ${emailToRemove} з білого списку?`)) return;

        setError(null);
        setSuccess(null);

        try {
            const updatedEmails = emails.filter(e => e !== emailToRemove);
            await setDoc(doc(db, "settings", "whitelist"), { emails: updatedEmails }, { merge: true });
            setEmails(updatedEmails);
            setSuccess("Email видалено.");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Error removing email", err);
            setError("Помилка при видаленні email.");
        }
    };

    const handleApproveRequest = async (email: string) => {
        try {
            // Додаємо до білого списку
            const updatedEmails = [...emails, email];
            await setDoc(doc(db, "settings", "whitelist"), { emails: updatedEmails }, { merge: true });
            setEmails(updatedEmails);

            // Видаляємо заявку
            await deleteDoc(doc(db, "access_requests", email));
            setRequests(requests.filter(r => r.email !== email));

            setSuccess(`Користувачу ${email} надано доступ.`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Error approving request", err);
            setError("Помилка при схваленні заявки.");
        }
    };

    const handleRejectRequest = async (email: string) => {
        if (!confirm(`Ви впевнені, що хочете відхилити заявку від ${email}?`)) return;

        try {
            // Видаляємо заявку
            await deleteDoc(doc(db, "access_requests", email));
            setRequests(requests.filter(r => r.email !== email));

            setSuccess(`Заявку від ${email} відхилено.`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Error rejecting request", err);
            setError("Помилка при відхиленні заявки.");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-warm-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
            </div>
        );
    }

    if (!user || user.email !== ADMIN_CONFIG.email) {
        return null; // Redirect handled by useEffect
    }

    return (
        <div className="min-h-screen bg-warm-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Заголовок */}
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-terracotta to-gold mx-auto mb-4 flex items-center justify-center shadow-lg"
                    >
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="font-serif text-3xl font-bold text-text-dark">
                        Адмін Панель
                    </h1>
                    <p className="text-text-muted mt-2">
                        Керування доступом до родинного архіву
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    {/* Секція: Заявки на розгляд (Показуємо тільки якщо є заявки) */}
                    {requests.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gold/30 p-6 sm:p-8">
                            <h2 className="text-xl font-semibold text-text-dark mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-gold" />
                                Заявки на розгляд ({requests.length})
                            </h2>
                            <p className="text-sm text-text-muted mb-6">
                                Ці користувачі намагалися увійти, але не мають доступу. Надайте або відхиліть доступ.
                            </p>

                            <div className="space-y-3">
                                {requests.map((req) => (
                                    <div key={req.email} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gold/5 border border-gold/20 gap-4">
                                        <div>
                                            <div className="font-medium text-text-dark">{req.displayName}</div>
                                            <div className="text-sm text-text-muted">{req.email}</div>
                                            <div className="text-xs text-text-light mt-1">
                                                {new Date(req.timestamp).toLocaleString("uk-UA")}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApproveRequest(req.email)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                                Схвалити
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req.email)}
                                                className="flex-1 sm:flex-none flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                title="Відхилити"
                                            >
                                                <XIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Секція: Білий список (Whitelist) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8">
                        <h2 className="text-xl font-semibold text-text-dark mb-6">Білий список (Whitelist)</h2>

                        <p className="text-sm text-text-muted mb-6">
                            Користувачі, чиї email-и знаходяться у цьому списку, матимуть доступ до перегляду фотографій.
                            Якщо список порожній, доступ матимуть усі, хто має посилання.
                        </p>

                        {/* Повідомлення */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 text-sm flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        {/* Форма додавання вручну */}
                        <form onSubmit={handleAddEmail} className="flex gap-2 mb-8">
                            <input
                                type="email"
                                placeholder="Введіть email вручну..."
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-colors bg-warm-white text-text-dark"
                            />
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-terracotta to-gold text-white font-medium hover:shadow-lg transition-all hover:-translate-y-0.5"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Додати</span>
                            </button>
                        </form>

                        {/* Список */}
                        <div className="space-y-2">
                            {emails.length === 0 ? (
                                <div className="text-center py-8 text-text-light border-2 border-dashed border-border rounded-xl">
                                    Список порожній. Вхід дозволено всім.
                                </div>
                            ) : (
                                emails.map((email) => (
                                    <div
                                        key={email}
                                        className="flex items-center justify-between p-4 rounded-xl bg-warm-white border border-border group"
                                    >
                                        <span className="font-medium text-text-dark">{email}</span>
                                        <button
                                            onClick={() => handleRemoveEmail(email)}
                                            className="p-2 text-text-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                                            title="Видалити"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                            {/* Адміністратор (завжди показуємо) */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-terracotta/5 border border-terracotta/20 mt-4">
                                <div>
                                    <span className="font-medium text-text-dark block">{ADMIN_CONFIG.email}</span>
                                    <span className="text-xs text-terracotta font-medium uppercase tracking-wider">Адміністратор</span>
                                </div>
                                <ShieldCheck className="w-5 h-5 text-terracotta" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
