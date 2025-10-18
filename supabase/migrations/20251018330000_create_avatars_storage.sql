-- =====================================================
-- MIGRATION: Create Avatars Storage Bucket
-- Description: Storage bucket para avatares de contactos
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Crear bucket público para avatares de contactos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-avatars',
  'contact-avatars',
  true, -- Público para lectura
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Todos pueden ver avatares (público)
CREATE POLICY "Public Access to Contact Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'contact-avatars');

-- Política: Solo usuarios autenticados pueden subir avatares
CREATE POLICY "Authenticated users can upload contact avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contact-avatars'
  AND auth.role() = 'authenticated'
);

-- Política: Solo el usuario que subió puede actualizar/eliminar
CREATE POLICY "Users can update their own contact avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contact-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'contact-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own contact avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contact-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Nota: Los comentarios en storage.objects requieren permisos de superusuario
-- Por lo tanto, se omiten en esta migración

DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada: Bucket de storage para avatares creado';
END $$;
