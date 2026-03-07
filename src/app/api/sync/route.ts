import { NextRequest, NextResponse } from "next/server";
import { listFilesInFolder, getDriveThumbnailLink, getDriveDirectLink } from "@/lib/drive";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { Photo, PhotoVersion, PhotoVersionType } from "@/lib/types";

// Функція для визначення типу версії та базового імені
function parseFileName(fileName: string): { baseName: string; type: PhotoVersionType } {
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
    const lowerName = nameWithoutExt.toLowerCase();

    if (lowerName.endsWith("_colorized") || lowerName.endsWith("_color")) {
        const baseName = nameWithoutExt.replace(/_colorized$/i, "").replace(/_color$/i, "");
        return { baseName, type: "colorized" };
    }

    if (lowerName.endsWith("_enhanced")) {
        const baseName = nameWithoutExt.replace(/_enhanced$/i, "");
        return { baseName, type: "enhanced" };
    }

    return { baseName: nameWithoutExt, type: "original" };
}

export async function POST(request: NextRequest) {
    try {
        // 1. Отримуємо файли з Google Drive
        const driveFiles = await listFilesInFolder();

        if (!driveFiles || driveFiles.length === 0) {
            return NextResponse.json({ message: "Папка порожня або не знайдена." });
        }

        // 2. Групуємо файли за базовим іменем
        const groupedFiles = new Map<string, {
            baseName: string;
            dateTaken: Date;
            versions: PhotoVersion[];
        }>();

        for (const file of driveFiles) {
            if (!file.id || !file.name) continue;

            const { baseName, type } = parseFileName(file.name);

            const version: PhotoVersion = {
                id: file.id,
                url: getDriveDirectLink(file.id),
                thumbnailUrl: getDriveThumbnailLink(file.id),
                type,
            };

            if (groupedFiles.has(baseName)) {
                groupedFiles.get(baseName)!.versions.push(version);
            } else {
                const fileDate = file.createdTime ? new Date(file.createdTime) : new Date();
                groupedFiles.set(baseName, {
                    baseName,
                    dateTaken: fileDate,
                    versions: [version],
                });
            }
        }

        // 3. Збираємо існуючі фотографії, щоб зберегти їхні метадані
        const existingPhotosSnapshot = await getDocs(collection(db, "photos"));
        const existingPhotos = new Map<string, Photo>();

        for (const docSnapshot of existingPhotosSnapshot.docs) {
            existingPhotos.set(docSnapshot.id, docSnapshot.data() as Photo);
        }

        // Для відстеження які фото все ще існують на диску
        const activeGroupIds = new Set<string>();

        let addedCount = 0;
        let updatedCount = 0;

        // 4. Створюємо фінальні об'єкти Photo та зберігаємо в базу
        for (const [baseName, group] of groupedFiles.entries()) {
            // Визначаємо найкращу версію для відображення в сітці
            const colorized = group.versions.find(v => v.type === "colorized");
            const enhanced = group.versions.find(v => v.type === "enhanced");
            const original = group.versions.find(v => v.type === "original");

            const bestVersion = colorized || enhanced || original;
            if (!bestVersion) continue;

            // Генеруємо стабільний ID для групи на основі baseName
            // Використовуємо baseName, так як він унікальний (або ID оригінального файлу)
            const groupId = original ? original.id : bestVersion.id;
            activeGroupIds.add(groupId);

            // Перевіряємо чи є вже таке фото
            const existingPhoto = existingPhotos.get(groupId);

            if (existingPhoto) {
                // Оновлюємо тільки технічні посилання, зберігаємо метадані
                const updatedPhotoData: Partial<Photo> = {
                    url: bestVersion.url,
                    thumbnailUrl: bestVersion.thumbnailUrl,
                    versions: group.versions,
                };
                await setDoc(doc(db, "photos", groupId), updatedPhotoData, { merge: true });
                updatedCount++;
            } else {
                // Створюємо нове фото
                const photoData: Photo = {
                    id: groupId,
                    url: bestVersion.url,
                    thumbnailUrl: bestVersion.thumbnailUrl,
                    name: baseName,
                    description: "", // Явно задаємо порожній опис
                    tags: [], // можна додати авто-тегування
                    dateTaken: Timestamp.fromDate(group.dateTaken),
                    uploadedBy: "Auto-Sync",
                    versions: group.versions,
                };
                await setDoc(doc(db, "photos", groupId), photoData);
                addedCount++;
            }
        }

        // 5. Видаляємо фото, яких більше немає на Google Drive
        let deletedCount = 0;
        for (const [existingId, _] of existingPhotos.entries()) {
            if (!activeGroupIds.has(existingId)) {
                await deleteDoc(doc(db, "photos", existingId));
                deletedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Синхронізація завершена. Додано: ${addedCount}, Оновлено: ${updatedCount}, Видалено: ${deletedCount} груп фотографій.`,
            addedCount,
            updatedCount,
            deletedCount
        });

    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json(
            { error: "Помилка синхронізації. Перевірте API ключі та Service Account." },
            { status: 500 }
        );
    }
}
