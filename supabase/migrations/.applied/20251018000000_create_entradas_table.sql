-- Create entradas table
CREATE TABLE IF NOT EXISTS public.entradas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_reparacion TEXT UNIQUE NOT NULL,
  nombre_cliente TEXT NOT NULL,
  telefono TEXT NOT NULL,
  modelo TEXT NOT NULL,
  problema TEXT NOT NULL,
  accesorios TEXT,
  observaciones TEXT,
  tecnico_asignado TEXT,
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En reparación', 'Listo', 'Entregado')),
  fecha_entrada TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all entradas"
  ON public.entradas
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert entradas"
  ON public.entradas
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update entradas"
  ON public.entradas
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete entradas"
  ON public.entradas
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create function to auto-generate id_reparacion
CREATE OR REPLACE FUNCTION public.generate_id_reparacion()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate ID in format: REP-YYYYMMDD-XXXX
    new_id := 'REP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Check if ID exists
    SELECT EXISTS(SELECT 1 FROM public.entradas WHERE id_reparacion = new_id) INTO exists;

    -- If doesn't exist, break loop
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate id_reparacion
CREATE OR REPLACE FUNCTION public.set_id_reparacion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id_reparacion IS NULL OR NEW.id_reparacion = '' THEN
    NEW.id_reparacion := generate_id_reparacion();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_id_reparacion
  BEFORE INSERT ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_id_reparacion();

-- Create trigger to update updated_at
CREATE TRIGGER handle_entradas_updated_at
  BEFORE UPDATE ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_entradas_id_reparacion ON public.entradas(id_reparacion);
CREATE INDEX idx_entradas_nombre_cliente ON public.entradas(nombre_cliente);
CREATE INDEX idx_entradas_estado ON public.entradas(estado);
CREATE INDEX idx_entradas_fecha_entrada ON public.entradas(fecha_entrada DESC);
CREATE INDEX idx_entradas_usuario_id ON public.entradas(usuario_id);

-- Create full-text search index
CREATE INDEX idx_entradas_search ON public.entradas USING gin(
  to_tsvector('spanish',
    coalesce(nombre_cliente, '') || ' ' ||
    coalesce(telefono, '') || ' ' ||
    coalesce(modelo, '') || ' ' ||
    coalesce(problema, '') || ' ' ||
    coalesce(id_reparacion, '')
  )
);
