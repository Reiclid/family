import { NextRequest, NextResponse } from "next/server";
import { uploadFileToDrive } from "@/lib/drive";
import { db } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const description = formData.get("description") as string;
        const tags = formData.get("tags") as string;
        const dateTaken = formData.get("dateTaken") as string;
        const uploadedBy = formData.get("uploadedBy") as string;

        if (!file) {
            return NextResponse.json({ error: "Файл не знайдено" }, { status: 400 });
        }

        // Перевірка типу файлу
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Непідтримуваний тип файлу" },
                { status: 400 }
            );
        }

        // Конвертація файлу в Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Завантаження на Google Drive
        const driveResult = await uploadFileToDrive(buffer, file.name, file.type);

        // Підготовка тегів
        const tagArray = tags
            ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
            : [];

        // Збереження метаданих у Firestore
        const photoData = {
            id: driveResult.fileId,
            url: driveResult.webViewLink,
            thumbnailUrl: driveResult.thumbnailLink,
            name: file.name,
            description: description || "",
            tags: tagArray,
            dateTaken: dateTaken
                ? Timestamp.fromDate(new Date(dateTaken))
                : Timestamp.fromDate(new Date()),
            uploadedBy: uploadedBy || "unknown",
        };

        await setDoc(doc(db, "photos", driveResult.fileId), photoData);

        return NextResponse.json({
            success: true,
            photo: photoData,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Помилка завантаження файлу. Перевірте налаштування Google Drive." },
            { status: 500 }
        );
    }
}
