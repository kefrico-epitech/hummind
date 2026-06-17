// src/lib/cloudinaryHelper.ts
import { toast } from "./notify";

// Fonction pour uploader une image avec preset unsigned
export const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
    const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    if (folder) formData.append("folder", folder);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        if (res.ok) {
            return data.secure_url;
        } else {
            throw new Error(data.error?.message || "Erreur lors de l'upload");
        }
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        toast.error("Échec de l'upload de l'image.");
        return null;
    }
};

// Remplacer = ré-upload et mettre à jour l’URL
export const replaceImageInCloudinary = async (newFile: File) => {
    return uploadToCloudinary(newFile);
};

// Supprimer côté client = juste retirer l’URL du state
export const deleteImageFromCloudinary = async () => {
    toast.success("Image retirée localement.");
    return true;
};
