import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UploadAvatarResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface UseAvatarUploadReturn {
  uploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadAvatar: (file: File, orgId: string) => Promise<UploadAvatarResult>;
  deleteAvatar: (avatarUrl: string) => Promise<boolean>;
}

/**
 * Hook para manejar la subida y eliminación de avatares de contactos
 * @returns Funciones y estados para gestionar avatares
 */
export function useAvatarUpload(): UseAvatarUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * Sube un avatar al storage de Supabase
   * @param file Archivo de imagen a subir
   * @param orgId ID de la organización (para organizar archivos)
   * @returns Resultado con URL del avatar subido o error
   */
  const uploadAvatar = async (
    file: File,
    orgId: string
  ): Promise<UploadAvatarResult> => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Validar tipo de archivo
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG, WebP o GIF"
        );
      }

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("El archivo es demasiado grande. Máximo 5MB");
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split(".").pop();
      const fileName = `${orgId}/${timestamp}_${randomString}.${fileExt}`;

      setUploadProgress(30);

      // Subir archivo al bucket
      const { data, error } = await supabase.storage
        .from("contact-avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading avatar:", error);
        throw new Error(error.message || "Error al subir el avatar");
      }

      setUploadProgress(70);

      // Obtener URL pública del archivo
      const {
        data: { publicUrl },
      } = supabase.storage.from("contact-avatars").getPublicUrl(data.path);

      setUploadProgress(100);
      setUploading(false);

      return {
        success: true,
        url: publicUrl,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setUploadError(errorMessage);
      setUploading(false);
      setUploadProgress(0);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * Elimina un avatar del storage
   * @param avatarUrl URL completa del avatar a eliminar
   * @returns true si se eliminó correctamente, false en caso contrario
   */
  const deleteAvatar = async (avatarUrl: string): Promise<boolean> => {
    try {
      // Extraer el path del archivo de la URL
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split("/contact-avatars/");
      if (pathParts.length < 2) {
        console.error("URL de avatar inválida");
        return false;
      }

      const filePath = pathParts[1];

      // Eliminar archivo del storage
      const { error } = await supabase.storage
        .from("contact-avatars")
        .remove([filePath]);

      if (error) {
        console.error("Error deleting avatar:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteAvatar:", error);
      return false;
    }
  };

  return {
    uploading,
    uploadProgress,
    uploadError,
    uploadAvatar,
    deleteAvatar,
  };
}
