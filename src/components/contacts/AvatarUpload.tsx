"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import AvatarText from "@/components/ui/avatar/AvatarText";
import { Upload, X, Camera } from "lucide-react";

interface AvatarUploadProps {
  /** URL actual del avatar (puede ser null para nuevo contacto) */
  currentAvatarUrl?: string | null;
  /** Nombre del contacto para mostrar iniciales si no hay avatar */
  contactName: string;
  /** ID de la organización para organizar los archivos */
  orgId: string;
  /** Callback cuando se sube exitosamente un avatar */
  onUploadSuccess: (url: string) => void;
  /** Callback cuando se elimina el avatar */
  onRemove?: () => void;
  /** Tamaño del avatar en píxeles */
  size?: number;
}

export function AvatarUpload({
  currentAvatarUrl,
  contactName,
  orgId,
  onUploadSuccess,
  onRemove,
  size = 120,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatarUrl || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploading, uploadProgress, uploadError, uploadAvatar, deleteAvatar } =
    useAvatarUpload();

  // Actualizar preview cuando cambia currentAvatarUrl
  useEffect(() => {
    setPreviewUrl(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    // Validar tipo de archivo en el cliente
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF)");
      return;
    }

    // Crear preview local inmediato
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Subir archivo
    const result = await uploadAvatar(file, orgId);

    if (result.success && result.url) {
      // Revocar preview local y usar URL del servidor
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(result.url);
      onUploadSuccess(result.url);
    } else {
      // Restaurar preview anterior en caso de error
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(currentAvatarUrl || null);
      alert(result.error || "Error al subir el avatar");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleRemoveAvatar = async () => {
    if (!previewUrl) return;

    const confirmed = confirm("¿Deseas eliminar el avatar actual?");
    if (!confirmed) return;

    // Si hay una URL de Supabase, intentar eliminar
    if (currentAvatarUrl?.includes("contact-avatars")) {
      await deleteAvatar(currentAvatarUrl);
    }

    setPreviewUrl(null);
    if (onRemove) {
      onRemove();
    }

    // Resetear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar preview area */}
      <div
        className={`
          relative rounded-full overflow-hidden
          border-4 border-gray-200 dark:border-gray-700
          transition-all duration-200
          ${isDragging ? "border-brand-500 scale-105" : ""}
          ${uploading ? "opacity-50" : ""}
          group cursor-pointer
        `}
        style={{ width: size, height: size }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={contactName || "Avatar"}
            fill
            className="object-cover"
            sizes={`${size}px`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AvatarText
              name={contactName || "?"}
              className="w-full h-full text-2xl"
            />
          </div>
        )}

        {/* Overlay al hacer hover */}
        <div
          className="
            absolute inset-0 bg-black/50
            flex items-center justify-center
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
          "
        >
          <Camera className="w-8 h-8 text-white" />
        </div>

        {/* Botón de eliminar */}
        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveAvatar();
            }}
            className="
              absolute -top-2 -right-2
              bg-red-500 hover:bg-red-600
              text-white rounded-full
              w-8 h-8 flex items-center justify-center
              shadow-lg transition-colors
              z-10
            "
            title="Eliminar avatar"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Progress bar */}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Botón de selección */}
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="
          flex items-center gap-2 px-4 py-2
          text-sm font-medium
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          rounded-lg
          hover:bg-gray-50 dark:hover:bg-gray-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        <Upload className="w-4 h-4" />
        {uploading ? "Subiendo..." : previewUrl ? "Cambiar foto" : "Subir foto"}
      </button>

      {/* Mensaje de ayuda */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
        {uploading
          ? `Subiendo ${uploadProgress}%...`
          : "JPG, PNG, WebP o GIF (máx. 5MB)"}
      </p>

      {/* Error */}
      {uploadError && (
        <p className="text-xs text-red-500 text-center max-w-[200px]">
          {uploadError}
        </p>
      )}
    </div>
  );
}
