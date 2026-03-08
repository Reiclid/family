"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Photo, PhotoVersionType } from "@/lib/types";
import { motion, AnimatePresence, PanInfo, useMotionValue } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Share2, Edit2, Save } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_CONFIG } from "@/config/admin";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PhotoLightboxProps {
    photos: Photo[];
    open: boolean;
    index: number;
    onClose: () => void;
}

export default function PhotoLightbox({ photos, open, index, onClose }: PhotoLightboxProps) {
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(index);
    const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
    const [activeVersions, setActiveVersions] = useState<Record<string, PhotoVersionType>>({});
    const [animationType, setAnimationType] = useState<"slide" | "fade">("slide");
    const [draggingDir, setDraggingDir] = useState<number | null>(null);

    // Стан редагування
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({ name: "", description: "", tags: "", dateTaken: "" });

    // Свайпи (нова логіка Track-Based Slider)
    const dragX = useMotionValue(0);

    const thumbstripRef = useRef<HTMLDivElement>(null);

    // Авто-скрол мініатюр, щоб активне фото було по центру
    useEffect(() => {
        if (!thumbstripRef.current) return;
        const activeThumb = document.getElementById(`thumb-${currentIndex}`);
        if (activeThumb) {
            const container = thumbstripRef.current;
            const scrollLeft = activeThumb.offsetLeft - (container.offsetWidth / 2) + (activeThumb.offsetWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: "smooth" });
        }
    }, [currentIndex]);

    // Скидаємо позицію після зміни індексу
    useEffect(() => {
        dragX.set(0);
    }, [currentIndex, dragX]);

    // Синхронізація індексу
    useEffect(() => {
        if (open) setCurrentIndex(index);
    }, [open, index]);

    const handlePrev = useCallback(() => {
        setAnimationType("slide");
        setDirection(-1);
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    }, [photos.length]);

    const handleNext = useCallback(() => {
        setAnimationType("slide");
        setDirection(1);
        setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    }, [photos.length]);

    // Фонове передзавантаження сусідніх фотографій (на 3 кроки вперед/назад)
    useEffect(() => {
        if (!open || photos.length === 0) return;
        const preloadCount = 3;
        for (let i = 1; i <= preloadCount; i++) {
            const nextIdx = (currentIndex + i) % photos.length;
            let prevIdx = currentIndex - i;
            if (prevIdx < 0) prevIdx += photos.length;

            [nextIdx, prevIdx].forEach(idx => {
                if (idx < 0 || idx >= photos.length) return;
                const p = photos[idx];
                const urlsToPreload = p.versions?.length ? p.versions.map(v => v.url) : [p.url];
                urlsToPreload.forEach(url => {
                    const img = new window.Image();
                    img.src = url;
                });
            });
        }
    }, [currentIndex, photos, open]);

    // Обробка клавішами (ESC, стрілки вліво/вправо)
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
        };

        window.addEventListener("keydown", handleKeyDown);
        // Блокуємо скрол фону
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "auto";
        };
    }, [open, currentIndex, photos.length, handlePrev, handleNext]);

    if (!open || photos.length === 0) return null;

    const currentPhoto = photos[currentIndex];

    // Захист від випадків, коли масив photos оновлюється під час відкритої галереї
    if (!currentPhoto) return null;

    const currentVersions = currentPhoto?.versions || [];

    // Знаходимо поточну активну версію
    const activeType = activeVersions[currentPhoto.id];
    const activeVersion = activeType
        ? currentVersions.find(v => v.type === activeType) || currentVersions[0] || { url: currentPhoto.url, type: 'original' }
        : currentVersions[0] || { url: currentPhoto.url, type: 'original' };

    const handleDrag = (e: any, info: PanInfo) => {
        if (info.offset.x > 10) setDraggingDir(-1);
        else if (info.offset.x < -10) setDraggingDir(1);
    };

    const handleDragEnd = (e: any, info: PanInfo) => {
        setDraggingDir(null);
        const threshold = 50;
        if (info.offset.x > threshold) {
            handlePrev();
        } else if (info.offset.x < -threshold) {
            handleNext();
        }
    };

    // Варіанти анімації зсуву
    const slideVariants = {
        enter: ({ dir, type }: { dir: number, type: "slide" | "fade" }) => {
            if (type === "fade") {
                return { opacity: 0, x: 0, y: 0, zIndex: 0 };
            }
            return {
                x: dir > 0 ? window.innerWidth : -window.innerWidth,
                opacity: 0,
                zIndex: 1
            };
        },
        center: {
            zIndex: 1,
            x: 0,
            y: 0,
            opacity: 1
        },
        exit: ({ dir, type }: { dir: number, type: "slide" | "fade" }) => {
            if (type === "fade") {
                return { opacity: 0, x: 0, y: 0, zIndex: 0 };
            }
            return {
                zIndex: 0,
                x: dir < 0 ? window.innerWidth : -window.innerWidth,
                opacity: 0
            };
        }
    };

    const typeLabels: Record<string, string> = {
        "original": "Оригінал",
        "enhanced": "Покращено",
        "colorized": "В кольорі"
    };

    // Навігація кліком по краях на мобільних пристроях
    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // Якщо клік в лівій 20% частині - Назад
        if (x < width * 0.2) {
            handlePrev();
        }
        // Якщо клік в правій 20% частині - Вперед
        else if (x > width * 0.8) {
            handleNext();
        }
    };

    // Поділитись (або скопіювати) фотографією
    const handleShare = async () => {
        try {
            // Проксі-запит для обходу правил CORS
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(activeVersion.url)}`;
            const response = await fetch(proxyUrl);
            const blob = await response.blob();

            // Перевіряємо, чи ми дійсно отримали зображення, а не HTML сторінку з помилкою
            if (!blob.type.startsWith('image/')) {
                throw new Error('Received invalid content type from proxy');
            }

            const file = new File([blob], `${currentPhoto.name}.jpg`, { type: blob.type });

            // 1. Спробуємо нативний Share API (працює на iOS, Android)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: currentPhoto.name,
                    text: currentPhoto.description || "Спогад з Сімейного Архіву",
                });
                return; // Успіх мобільного share
            }

            // 2. Якщо Share API не підтримує файли (чи це ПК) - копіюємо в буфер як Картинку!
            try {
                const clipboardItem = new ClipboardItem({ [blob.type]: blob });
                await navigator.clipboard.write([clipboardItem]);
                alert("Фото успішно скопійовано в буфер обміну! Можете вставити його в повідомлення (Ctrl+V або Paste).");
            } catch (clipboardErr) {
                console.error("Помилка копіювання зображення в буфер", clipboardErr);
                alert("Ваш браузер не підтримує пряме копіювання файлів. Можливо, відкрийте фото і натисніть 'Скопіювати зображення'.");
            }

        } catch (error: any) {
            // Ігноруємо помилку, якщо користувач просто закрив меню "Поділитися"
            if (error?.name === 'AbortError') {
                return;
            }

            console.error("Помилка при спробі поділитись фото", error);
            try {
                // Якщо зовсім все погано — копіюємо хоча б посилання на диск
                await navigator.clipboard.writeText(activeVersion.url);
                alert("Не вдалось завантажити фото для відправки. Скопійовано пряме посилання.");
            } catch (err) {
                alert("Помилка. Не вдалося ані переслати файл, ані скопіювати посилання.");
            }
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const dateObj = currentPhoto.dateTaken.toDate();
        // Формат YYYY-MM-DD
        const formattedDate = dateObj.toISOString().split('T')[0];
        setEditData({
            name: currentPhoto.name,
            description: currentPhoto.description || "",
            tags: currentPhoto.tags.join(", "),
            dateTaken: formattedDate,
        });
        setIsEditing(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const photoRef = doc(db, "photos", currentPhoto.id);
            const selectedDate = new Date(editData.dateTaken);
            selectedDate.setHours(12, 0, 0, 0); // Щоб уникнути проблем з часовими поясами

            await updateDoc(photoRef, {
                name: editData.name,
                description: editData.description,
                tags: editData.tags.split(",").map(t => t.trim()).filter(Boolean),
                dateTaken: Timestamp.fromDate(selectedDate)
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Помилка збереження", error);
            alert("Помилка збереження. Спробуйте ще раз.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[102] flex items-center justify-center bg-black/95 backdrop-blur-3xl"
                    onClick={onClose}
                >
                    {/* Верхня панель інструментів (Right) */}
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 flex flex-wrap justify-end gap-2 md:gap-3 z-50">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleShare(); }}
                            className="p-2.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md"
                            title="Скопіювати фото"
                        >
                            <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        {(user?.email === ADMIN_CONFIG.email || user?.isEditor) && (
                            <button
                                onClick={handleEditClick}
                                className="p-2.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md"
                                title="Редагувати інформацію"
                            >
                                <Edit2 className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="p-2.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md"
                            title="Закрити"
                        >
                            <X className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>

                    {/* Лічильник (Left) */}
                    <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-white/10 text-white/80 font-medium text-sm md:text-base backdrop-blur-md z-50 shadow-md">
                        {currentIndex + 1} / {photos.length}
                    </div>

                    {/* Навігація вліво (тільки desktop) */}
                    {photos.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            className="hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 text-white/50 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md z-50 group hover:scale-110 active:scale-95"
                        >
                            <ChevronLeft className="w-8 h-8 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    )}

                    {/* Зображення зі свайпом та навігацією по краях */}
                    <div
                        className="relative w-screen h-screen max-w-[100vw] max-h-[100dvh] flex flex-col items-center justify-center cursor-pointer md:cursor-default overflow-hidden"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(e);
                        }}
                    >
                        {/* Головне фото */}
                        <AnimatePresence initial={false} custom={{ dir: direction, type: animationType }} mode="popLayout">
                            <motion.div
                                key={`${currentPhoto.id}-${activeVersion.type}`}
                                custom={{ dir: direction, type: animationType }}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    y: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: animationType === "fade" ? 0.4 : 0.2 }
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.8}
                                onDrag={handleDrag}
                                onDragEnd={handleDragEnd}
                                className="absolute inset-x-0 inset-y-16 md:inset-x-12 md:inset-y-12 flex items-center justify-center overflow-hidden z-10"
                            >
                                <Image
                                    src={activeVersion.url}
                                    alt={currentPhoto.name}
                                    fill
                                    className="object-contain drop-shadow-2xl pointer-events-none select-none"
                                    sizes="100vw"
                                    priority={true}
                                    unoptimized={true}
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Опис */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="absolute bottom-28 md:bottom-32 left-0 right-0 text-center px-4 pointer-events-none z-10"
                        >
                            <h2 className="text-white text-lg md:text-xl font-serif mb-1 tracking-wide drop-shadow-lg">{currentPhoto.name}</h2>
                            <p className="text-white/80 text-xs md:text-sm flex flex-wrap items-center justify-center gap-1.5 md:gap-2 drop-shadow-lg">
                                {currentPhoto.description && <span>{currentPhoto.description}</span>}
                                {currentPhoto.description && <span>•</span>}
                                <span>{currentPhoto.dateTaken.toDate().getFullYear()}</span>
                                {currentPhoto.tags.length > 0 && <span>•</span>}
                                {currentPhoto.tags.length > 0 && <span>{currentPhoto.tags.join(", ")}</span>}
                            </p>
                        </motion.div>

                        {/* Стрічка мініатюр (Google Photos style) */}
                        <div
                            ref={thumbstripRef}
                            className="absolute bottom-4 left-0 right-0 h-20 md:h-24 px-4 overflow-x-auto overflow-y-hidden whitespace-nowrap z-50 flex items-center gap-2 custom-scrollbar scroll-smooth"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mx-auto flex gap-2 w-max">
                                {photos.map((photo, idx) => {
                                    const isCurrent = idx === currentIndex;
                                    const thumbnailUrl = photo.thumbnailUrl || photo.versions?.[0]?.url || photo.url;

                                    // Рендеримо тільки сусідні 20 фото для оптимізації
                                    if (Math.abs(idx - currentIndex) > 20) return null;

                                    return (
                                        <div
                                            key={photo.id}
                                            id={`thumb-${idx}`}
                                            onClick={() => {
                                                if (idx === currentIndex) return;
                                                setAnimationType("slide");
                                                setDirection(idx > currentIndex ? 1 : -1);
                                                setCurrentIndex(idx);
                                            }}
                                            className={`relative h-16 md:h-20 aspect-square md:aspect-video rounded-md overflow-hidden cursor-pointer transition-all duration-300 flex-shrink-0 ${isCurrent ? "ring-2 ring-white scale-110 brightness-110 shadow-lg" : "opacity-50 hover:opacity-100"
                                                }`}
                                        >
                                            <Image
                                                src={thumbnailUrl}
                                                alt={`Thumbnail ${idx}`}
                                                fill
                                                className="object-cover"
                                                sizes="100px"
                                                priority={false} // Важливо для усунення попереджень preload
                                                unoptimized={true}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Навігація вправо (тільки desktop) */}
                    {photos.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            className="hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 text-white/50 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md z-50 group hover:scale-110 active:scale-95"
                        >
                            <ChevronRight className="w-8 h-8 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    )}

                    {/* Панель перемикання версій */}
                    {currentVersions.length > 1 && (
                        <div
                            className="absolute top-20 md:top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-1.5 md:p-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {currentVersions.map((version) => {
                                const isActive = (activeVersions[currentPhoto.id] || currentVersions[0].type) === version.type;

                                return (
                                    <button
                                        key={version.type}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAnimationType("fade");
                                            setActiveVersions(prev => ({ ...prev, [currentPhoto.id]: version.type as PhotoVersionType }));
                                        }}
                                        className={`px-4 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 ${isActive
                                            ? "bg-white text-black shadow-lg scale-105"
                                            : "text-white/80 hover:text-white hover:bg-white/20"
                                            }`}
                                    >
                                        {typeLabels[version.type] || version.type}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Модальне вікно редагування */}
                    <AnimatePresence>
                        {isEditing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                                onClick={(e) => {
                                    e.stopPropagation(); // Блокуємо кліки поза формою
                                }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white/95 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 w-11/12 max-w-md shadow-2xl border border-white/50"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-text-dark font-serif">Редагування</h3>
                                        <button onClick={() => setIsEditing(false)} className="text-text-muted hover:text-text-dark">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleSaveEdit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-muted mb-1">Назва</label>
                                            <input
                                                type="text"
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-border bg-white text-text-dark focus:ring-2 focus:ring-terracotta/50 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-muted mb-1">Опис</label>
                                            <textarea
                                                value={editData.description}
                                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-border bg-white text-text-dark focus:ring-2 focus:ring-terracotta/50 outline-none"
                                                rows={2}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-muted mb-1">Теги (через кому)</label>
                                            <input
                                                type="text"
                                                value={editData.tags}
                                                onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-border bg-white text-text-dark focus:ring-2 focus:ring-terracotta/50 outline-none"
                                                placeholder="день народження, 1995"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-muted mb-1">Дата</label>
                                            <input
                                                type="date"
                                                value={editData.dateTaken}
                                                onChange={(e) => setEditData({ ...editData, dateTaken: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-border bg-white text-text-dark focus:ring-2 focus:ring-terracotta/50 outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="px-5 py-2.5 rounded-xl font-medium text-text-muted hover:text-text-dark hover:bg-cream transition-colors"
                                            >
                                                Скасувати
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="px-5 py-2.5 rounded-xl font-medium bg-terracotta text-white hover:bg-terracotta-dark disabled:opacity-50 transition-colors flex items-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                {isSaving ? "Збереження..." : "Зберегти"}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
