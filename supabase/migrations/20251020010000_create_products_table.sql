-- =====================================================
-- MIGRATION: Create Products Table
-- Description: Sistema de productos para presupuestos e inventario
-- =====================================================

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Información básica
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),

  -- Tipo de producto
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('part', 'service')),
  -- 'part' = Pieza almacenable (afecta inventario)
  -- 'service' = Servicio/Mano de obra (NO afecta inventario)

  -- Precio y costos
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(12,2) DEFAULT 0,

  -- Inventario (solo para product_type = 'part')
  track_inventory BOOLEAN DEFAULT false,
  current_stock DECIMAL(12,3) DEFAULT 0,
  min_stock DECIMAL(12,3) DEFAULT 0,
  max_stock DECIMAL(12,3) DEFAULT NULL,
  stock_unit VARCHAR(20) DEFAULT 'unidad', -- unidad, metro, litro, kg, etc.

  -- Categorización
  category VARCHAR(100),
  brand VARCHAR(100),
  tags TEXT[] DEFAULT '{}', -- Array de etiquetas

  -- Estado
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  notes TEXT,
  image_url TEXT,
  barcode VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT sku_org_unique UNIQUE (org_id, sku),
  CONSTRAINT barcode_org_unique UNIQUE (org_id, barcode),
  CONSTRAINT positive_prices CHECK (sale_price >= 0 AND cost_price >= 0),
  CONSTRAINT positive_stock CHECK (current_stock >= 0),
  CONSTRAINT track_inventory_for_parts CHECK (
    product_type = 'service' OR track_inventory IN (true, false)
  )
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_products_org_id ON products(org_id);
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category) WHERE category IS NOT NULL;
CREATE INDEX idx_products_brand ON products(brand) WHERE brand IS NOT NULL;
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('spanish', name));

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE products IS 'Catálogo de productos y servicios para presupuestos e inventario';
COMMENT ON COLUMN products.product_type IS 'Tipo: part (pieza almacenable) o service (servicio/mano de obra)';
COMMENT ON COLUMN products.track_inventory IS 'Si TRUE, el sistema controla el stock de este producto';
COMMENT ON COLUMN products.current_stock IS 'Stock actual disponible (solo para piezas con track_inventory=true)';
COMMENT ON COLUMN products.stock_unit IS 'Unidad de medida: unidad, metro, litro, kg, etc.';

-- RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver productos de su organización
CREATE POLICY products_select_policy ON products
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Policy: Los usuarios pueden insertar productos en su organización
CREATE POLICY products_insert_policy ON products
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Policy: Los usuarios pueden actualizar productos de su organización
CREATE POLICY products_update_policy ON products
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Policy: Los usuarios pueden eliminar productos de su organización
CREATE POLICY products_delete_policy ON products
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );
