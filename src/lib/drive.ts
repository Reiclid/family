import { google } from "googleapis";
import { Readable } from "stream";

// Ініціалізація Google Drive API з Service Account
function getDriveService() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/drive"],
    });

    return google.drive({ version: "v3", auth });
}

// Отримання списку всіх файлів у цільовій папці
export async function listFilesInFolder() {
    const drive = getDriveService();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
        throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured");
    }

    const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, webViewLink, thumbnailLink, createdTime)",
        pageSize: 1000,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
    });

    return response.data.files || [];
}

// Завантаження файлу на Google Drive
export async function uploadFileToDrive(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
): Promise<{ fileId: string; webViewLink: string; thumbnailLink: string }> {
    const drive = getDriveService();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const response = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: folderId ? [folderId] : [],
        },
        media: {
            mimeType,
            body: Readable.from(fileBuffer),
        },
        fields: "id, webViewLink, thumbnailLink",
        supportsAllDrives: true,
    });

    // Зробити файл доступним по посиланню
    await drive.permissions.create({
        fileId: response.data.id!,
        requestBody: {
            role: "reader",
            type: "anyone",
        },
    });

    const fileId = response.data.id!;

    return {
        fileId,
        webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        thumbnailLink: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    };
}

// Генерація прямого посилання на зображення з Google Drive
export function getDriveDirectLink(fileId: string): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

// Генерація thumbnail посилання
export function getDriveThumbnailLink(fileId: string): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}
