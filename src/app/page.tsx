"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Photo } from "@/lib/types";
import { MOCK_PHOTOS } from "@/lib/mockData";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import YearTimeline from "@/components/YearTimeline";
import PhotoGrid from "@/components/PhotoGrid";
import PhotoLightbox from "@/components/PhotoLightbox";
import { Loader2, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [useMockData, setUseMockData] = useState(false);

  // Редірект якщо не авторизований
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Завантаження фото з Firestore
  useEffect(() => {
    async function fetchPhotos() {
      if (!user) return;

      try {
        const photosQuery = query(
          collection(db, "photos"),
          orderBy("dateTaken", "desc")
        );
        const snapshot = await getDocs(photosQuery);
        const fetchedPhotos = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Photo[];

        if (fetchedPhotos.length > 0) {
          setPhotos(fetchedPhotos);
        } else {
          // Якщо немає фото у Firestore — використовуємо mock-дані
          setPhotos(MOCK_PHOTOS);
          setUseMockData(true);
        }
      } catch (error) {
        console.error("Error fetching photos:", error);
        // Якщо Firebase не налаштований — показуємо demo
        setPhotos(MOCK_PHOTOS);
        setUseMockData(true);
      } finally {
        setLoadingPhotos(false);
      }
    }

    fetchPhotos();
  }, [user]);

  // Унікальні роки для timeline
  const years = useMemo(() => {
    const yearSet = new Set(
      photos.map((p) => p.dateTaken.toDate().getFullYear())
    );
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [photos]);

  // Фільтрація фото
  const filteredPhotos = useMemo(() => {
    let result = photos;

    // Фільтр по року
    if (activeYear !== null) {
      result = result.filter(
        (p) => p.dateTaken.toDate().getFullYear() === activeYear
      );
    }

    // Фільтр по пошуковому запиту
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const tagMatch = p.tags.some((t) => t.toLowerCase().includes(q));
        const yearMatch = p.dateTaken.toDate().getFullYear().toString().includes(q);
        return nameMatch || descMatch || tagMatch || yearMatch;
      });
    }

    return result;
  }, [photos, activeYear, searchQuery]);

  const handlePhotoClick = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleYearClick = useCallback((year: number | null) => {
    setActiveYear(year);
  }, []);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Demo банер */}
        {useMockData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gold/10 border border-gold/30 text-text-dark text-sm text-center"
          >
            <span className="font-medium">🎨 Демо-режим</span> — відображаються тестові фотографії.
            Налаштуйте Firebase для роботи з реальними даними.
          </motion.div>
        )}

        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-text-dark mb-3">
            Наші спогади
          </h2>
          <p className="text-text-muted flex items-center justify-center gap-2">
            <ImageIcon className="w-4 h-4" />
            {photos.length} фото в архіві
          </p>
        </motion.div>

        {/* Пошук */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Timeline років */}
        <div className="mb-8">
          <YearTimeline
            years={years}
            activeYear={activeYear}
            onYearClick={handleYearClick}
          />
        </div>

        {/* Сітка фото */}
        {loadingPhotos ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
          </div>
        ) : (
          <PhotoGrid photos={filteredPhotos} onPhotoClick={handlePhotoClick} />
        )}

        {/* Lightbox */}
        <PhotoLightbox
          photos={filteredPhotos}
          open={lightboxOpen}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <p className="text-center text-sm text-text-light">
          Сімейний Архів • Зберігаємо спогади для майбутніх поколінь
        </p>
      </footer>
    </div>
  );
}
