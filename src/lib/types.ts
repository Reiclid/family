import { Timestamp } from "firebase/firestore";

export type PhotoVersionType = "original" | "enhanced" | "colorized";

export interface PhotoVersion {
    id: string;
    url: string;
    thumbnailUrl: string;
    type: PhotoVersionType;
}

// Тип фотографії у Firestore
export interface Photo {
    id: string; // id оригінального файлу або згенерований id групи
    url: string; // посилання на найкращу версію
    thumbnailUrl: string; // мініатюра найкращої версії
    name: string; // базова назва файлу
    description?: string;
    tags: string[]; // теги: ["день народження", "бабуся", "1995"]
    dateTaken: Timestamp;
    uploadedBy: string; // email користувача
    versions?: PhotoVersion[]; // доступні версії: оригінал, покращена, в кольорі
}

// Тип для форми завантаження
export interface UploadFormData {
    file: File;
    description: string;
    tags: string;
    dateTaken: string;
}

// Тип користувача
export interface AppUser {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    isEditor: boolean;
}
