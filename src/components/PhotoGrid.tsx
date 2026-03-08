"use client";

import { Photo, PhotoVersion } from "@/lib/types";
import { motion } from "framer-motion";
import { Calendar, Tag, Layers } from "lucide-react";
import { useState, useEffect, useLayoutEffect } from "react";
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

    const activeImage = versions[currentVersionIdx].thumbnailUrl || versions[currentVersionIdx].url;
    // Тільки перші 8 зображень завантажуємо одразу "eager", щоб інші не гальмували
    const isEager = index < 8;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (index % 4) * 0.05 }} // робимо невелику затримку для кожного стовпчика
            className="group cursor-pointer"
            onClick={() => onPhotoClick(index)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setCurrentVersionIdx(0); }}
        >
            <div className="relative overflow-hidden rounded-2xl bg-cream shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Зображення */}
                <Image
                    src={activeImage}
                    alt={photo.name}
                    loading={isEager ? "eager" : "lazy"}
                    width={500}
                    height={500}
                    unoptimized={true}
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

// Хук для відслідковування розміру вікна
function useWindowSize() {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
}

export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
    const [width] = useWindowSize();

    // Визначаємо кількість колонок залежно від ширини (як у Tailwind breakpoints)
    let columnsCount = 1;
    if (width >= 1280) columnsCount = 4; // xl
    else if (width >= 1024) columnsCount = 3; // lg
    else if (width >= 640) columnsCount = 2; // sm

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

    // JS Masonry алгоритм (Зліва-направо)
    const columns: Array<Array<{ photo: Photo; originalIndex: number }>> = Array.from({ length: columnsCount }, () => []);

    photos.forEach((photo, index) => {
        const columnIndex = index % columnsCount;
        columns[columnIndex].push({ photo, originalIndex: index });
    });

    return (
        <div className="flex w-full gap-4 items-start">
            {columns.map((column, colIdx) => (
                <div key={colIdx} className="flex flex-col flex-1 gap-4">
                    {column.map((item) => (
                        <GridItem
                            key={item.photo.id}
                            photo={item.photo}
                            index={item.originalIndex}
                            onPhotoClick={onPhotoClick}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
