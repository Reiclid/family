"use client";

import { useState, useCallback } from "react";
import { Upload, X, Calendar, Tag, FileImage, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadForm() {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [dateTaken, setDateTaken] = useState("");
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
            setError("Підтримуються тільки фото та відео файли");
            return;
        }
        if (f.size > 50 * 1024 * 1024) {
            setError("Максимальний розмір файлу — 50 МБ");
            return;
        }
        setFile(f);
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(f);
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
            }
        },
        [handleFile]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !user) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("description", description);
            formData.append("tags", tags);
            formData.append("dateTaken", dateTaken);
            formData.append("uploadedBy", user.email);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Помилка завантаження");
            }

            setSuccess(true);
            setFile(null);
            setPreview(null);
            setDescription("");
            setTags("");
            setDateTaken("");

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Помилка завантаження");
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            {/* Зона завантаження */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-2xl transition-all duration-300
          ${dragActive
                        ? "border-terracotta bg-terracotta/5 scale-[1.02]"
                        : "border-border hover:border-terracotta/50 bg-white"
                    }
          ${preview ? "p-4" : "p-12"}
        `}
            >
                <AnimatePresence mode="wait">
                    {preview ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative"
                        >
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-64 object-contain rounded-xl bg-cream"
                            />
                            <button
                                type="button"
                                onClick={removeFile}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <p className="mt-2 text-sm text-text-muted text-center">{file?.name}</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-cream mx-auto mb-4 flex items-center justify-center">
                                <FileImage className="w-8 h-8 text-terracotta" />
                            </div>
                            <p className="font-serif text-lg text-text-dark mb-2">
                                Перетягніть фото сюди
                            </p>
                            <p className="text-sm text-text-muted mb-4">або</p>
                            <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-terracotta to-terracotta-light text-white font-medium text-sm cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5">
                                <Upload className="w-4 h-4" />
                                Обрати файл
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs text-text-light mt-4">
                                Максимальний розмір: 50 МБ • JPG, PNG, WEBP, MP4
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Поля метаданих */}
            <div className="space-y-4">
                {/* Опис */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text-dark mb-2">
                        <FileImage className="w-4 h-4 text-terracotta" />
                        Опис фото
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Напишіть коротку історію цього фото..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-border text-text-dark placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm resize-none"
                    />
                </div>

                {/* Теги */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text-dark mb-2">
                        <Tag className="w-4 h-4 text-olive" />
                        Теги
                    </label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="день народження, бабуся, літо, 1995"
                        className="w-full px-4 py-3 bg-white rounded-xl border border-border text-text-dark placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-olive/30 focus:border-olive transition-all text-sm"
                    />
                    <p className="text-xs text-text-light mt-1">Розділяйте теги комою</p>
                </div>

                {/* Дата зйомки */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text-dark mb-2">
                        <Calendar className="w-4 h-4 text-deep-blue" />
                        Дата зйомки
                    </label>
                    <input
                        type="date"
                        value={dateTaken}
                        onChange={(e) => setDateTaken(e.target.value)}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-border text-text-dark focus:outline-none focus:ring-2 focus:ring-deep-blue/30 focus:border-deep-blue transition-all text-sm"
                    />
                </div>
            </div>

            {/* Помилка */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Успіх */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm"
                    >
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        Фото успішно завантажено до архіву!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Кнопка відправки */}
            <button
                type="submit"
                disabled={!file || uploading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-terracotta to-gold text-white font-semibold text-base
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300
                   active:translate-y-0"
            >
                {uploading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Завантаження...
                    </>
                ) : (
                    <>
                        <Upload className="w-5 h-5" />
                        Завантажити до архіву
                    </>
                )}
            </button>
        </form>
    );
}
