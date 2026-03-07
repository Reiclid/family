"use client";

import { Photo, PhotoVersion } from "@/lib/types";
import { motion } from "framer-motion";
import { Calendar, Tag, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

interface PhotoGridProps {
    photos: Photo[];
    onPhotoClick: (index: number) => void;
}

function GridItem({ photo, index, onPhotoClick }: { photo: Photo; index: number; onPhotoClick: (index: number) => void }) {
    const versions = photo.versions && photo.versions.length > 0
        ? photo.versions
        : [{ id: photo.id, url: photo.url, thumbnailUrl: photo.thumbnailUrl, type: "original" as const }];

    const [currentVersionIdx, setCurrentVersionIdx] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Циклічне перемикання версій при наведенні
    useEffect(() => {
        if (!isHovered || versions.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentVersionIdx((prev) => (prev + 1) % versions.length);
        }, 1200); // зміна кожні 1.2с

        return () => clearInterval(interval);
    }, [isHovered, versions.length, setCurrentVersionIdx]);

    const activeImage = versions[currentVersionIdx].thumbnailUrl || versions[currentVersionIdx].url;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="break-inside-avoid group cursor-pointer"
            onClick={() => onPhotoClick(index)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setCurrentVersionIdx(0); }}
        >
            <div className="relative overflow-hidden rounded-2xl bg-cream shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Зображення */}
                <Image
                    src={activeImage}
                    alt={photo.name}
                    loading="eager"
                    width={500}
                    height={500}
                    unoptimized={false}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Оверлей з інформацією */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-serif text-white text-lg font-semibold mb-1 line-clamp-1">
                            {photo.name}
                        </h3>
                        {photo.description && (
                            <p className="text-white/80 text-sm mb-2 line-clamp-2">
                                {photo.description}
                            </p>
                        )}
                        <div className="flex items-center gap-3 text-white/60 text-xs">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {photo.dateTaken.toDate().getFullYear()}
                            </span>
                            {versions.length > 1 && (
                                <span className="flex items-center gap-1 text-gold">
                                    <Layers className="w-3 h-3" />
                                    {versions.length} версії
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Індикатор кількості версій та рік у кутку */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-medium text-text-dark shadow-sm">
                        {photo.dateTaken.toDate().getFullYear()}
                    </span>
                    {versions.length > 1 && (
                        <div className="flex gap-1 bg-black/50 p-1 rounded-full backdrop-blur-sm">
                            {versions.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentVersionIdx ? 'bg-white' : 'bg-white/30'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
    if (photos.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
            >
                <div className="w-20 h-20 rounded-full bg-cream mx-auto mb-6 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="font-serif text-2xl text-text-dark mb-2">Нічого не знайдено</h3>
                <p className="text-text-muted max-w-md mx-auto">
                    Спробуйте змінити пошуковий запит або оберіть інший рік
                </p>
            </motion.div>
        );
    }

    return (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {photos.map((photo, index) => (
                <GridItem key={photo.id} photo={photo} index={index} onPhotoClick={onPhotoClick} />
            ))}
        </div>
    );
}
