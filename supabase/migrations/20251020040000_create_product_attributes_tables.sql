-- =====================================================
-- MIGRATION: Create Product Attributes Tables
-- Description: Tablas para marcas, categorías y etiquetas reutilizables
-- =====================================================

-- =====================================================
-- TABLA: Brands (Marcas)
-- =====================================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  website VARCHAR(255),

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT brand_name_org_unique UNIQUE (org_id, name)
);

-- Índices
CREATE INDEX idx_brands_org_id ON brands(org_id);
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_brands_active ON brands(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY brands_select_policy ON brands
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY brands_insert_policy ON brands
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY brands_update_policy ON brands
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY brands_delete_policy ON brands
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- =====================================================
-- TABLA: Categories (Categorías)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Nombre del icono (opcional)
  color VARCHAR(7), -- Color hex (opcional)

  -- Jerarquía (opcional para categorías padre/hijo)
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT category_name_org_unique UNIQUE (org_id, name)
);

-- Índices
CREATE INDEX idx_categories_org_id ON categories(org_id);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_parent_id ON categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_categories_active ON categories(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_select_policy ON categories
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY categories_insert_policy ON categories
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY categories_update_policy ON categories
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY categories_delete_policy ON categories
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- =====================================================
-- TABLA: Tags (Etiquetas)
-- =====================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Color hex por defecto (azul)
  description TEXT,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT tag_name_org_unique UNIQUE (org_id, name)
);

-- Índices
CREATE INDEX idx_tags_org_id ON tags(org_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_active ON tags(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY tags_select_policy ON tags
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY tags_insert_policy ON tags
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY tags_update_policy ON tags
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY tags_delete_policy ON tags
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- =====================================================
-- TABLA: Product Tags (Relación muchos a muchos)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_tags (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (product_id, tag_id)
);

-- Índices
CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag_id ON product_tags(tag_id);

-- RLS
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_tags_select_policy ON product_tags
  FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY product_tags_insert_policy ON product_tags
  FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY product_tags_delete_policy ON product_tags
  FOR DELETE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- =====================================================
-- MODIFICAR TABLA PRODUCTS
-- =====================================================

-- Cambiar brand y category a ser foreign keys
ALTER TABLE products
  DROP COLUMN IF EXISTS brand CASCADE,
  DROP COLUMN IF EXISTS category CASCADE,
  DROP COLUMN IF EXISTS tags CASCADE;

ALTER TABLE products
  ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Índices para las nuevas relaciones
CREATE INDEX idx_products_brand_id ON products(brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX idx_products_category_id ON products(category_id) WHERE category_id IS NOT NULL;

-- Comentarios
COMMENT ON TABLE brands IS 'Catálogo de marcas reutilizables para productos';
COMMENT ON TABLE categories IS 'Catálogo de categorías reutilizables para productos';
COMMENT ON TABLE tags IS 'Catálogo de etiquetas reutilizables para productos';
COMMENT ON TABLE product_tags IS 'Relación muchos a muchos entre productos y etiquetas';
