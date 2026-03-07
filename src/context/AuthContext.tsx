"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { ADMIN_CONFIG } from "@/config/admin";
import { AppUser } from "@/lib/types";

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            if (firebaseUser && firebaseUser.email) {
                // Завжди пускаємо адміністратора
                if (firebaseUser.email === ADMIN_CONFIG.email) {
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        isEditor: true, // Адмін завжди має права редактора
                    });
                    setError(null);
                    setLoading(false);
                    return;
                }

                try {
                    // Перевірка білого списку з Firestore
                    const settingsDoc = await getDoc(doc(db, "settings", "whitelist"));
                    const data = settingsDoc.exists() ? settingsDoc.data() : {};
                    const allowedEmails: string[] = data.emails || [];
                    const editorEmails: string[] = data.editors || [];

                    // Перевіряємо чи email є в білому списку
                    if (allowedEmails.includes(firebaseUser.email)) {
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            isEditor: editorEmails.includes(firebaseUser.email),
                        });
                        setError(null);
                    } else {
                        // Зберігаємо запит на доступ у Firestore
                        await setDoc(doc(db, "access_requests", firebaseUser.email), {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName || "Без імені",
                            photoURL: firebaseUser.photoURL || null,
                            status: "pending",
                            timestamp: new Date().toISOString()
                        }, { merge: true });

                        // Email не у білому списку - відображаємо статус "на розгляді"
                        firebaseSignOut(auth);
                        setUser(null);
                        setError("pending"); // Спеціальний код помилки
                    }
                } catch (err) {
                    console.error("Error fetching whitelist", err);
                    firebaseSignOut(auth);
                    setUser(null);
                    setError("Помилка перевірки доступу.");
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            setError(null);
            setLoading(true);
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            setError("Помилка входу. Спробуйте ще раз.");
            console.error("Sign-in error:", err);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
        } catch (err) {
            console.error("Sign-out error:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
