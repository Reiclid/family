"use client";

import { useState } from "react";
import { RefreshCw, Check, AlertCircle } from "lucide-react";

interface SyncButtonProps {
    onSyncComplete?: () => void;
}

export default function SyncButton({ onSyncComplete }: SyncButtonProps) {
    const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSync = async () => {
        setStatus("syncing");
        setMessage("");

        try {
            const response = await fetch("/api/sync", { method: "POST" });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Помилка");

            setStatus("success");
            setMessage(data.message);

            if (onSyncComplete) {
                onSyncComplete();
            }

            setTimeout(() => setStatus("idle"), 5000);
        } catch (err: any) {
            setStatus("error");
            setMessage(err.message);
            setTimeout(() => setStatus("idle"), 5000);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleSync}
                disabled={status === "syncing"}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-cream text-text-dark hover:bg-border transition-colors disabled:opacity-50"
            >
                <RefreshCw className={`w-4 h-4 ${status === "syncing" ? "animate-spin" : ""}`} />
                <span>Синхронізувати з Диском</span>
            </button>

            {status === "success" && (
                <span className="flex items-center gap-1 text-xs text-olive">
                    <Check className="w-3 h-3" /> {message}
                </span>
            )}

            {status === "error" && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" /> {message}
                </span>
            )}
        </div>
    );
}
