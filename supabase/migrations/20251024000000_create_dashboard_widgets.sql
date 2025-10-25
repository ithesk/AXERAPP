-- Tabla para almacenar la configuración de widgets del dashboard por usuario
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  widget_type VARCHAR(50) NOT NULL, -- 'metrics', 'sales_chart', 'recent_orders', 'demographics', etc.
  position_x INT NOT NULL DEFAULT 0,
  position_y INT NOT NULL DEFAULT 0,
  width INT NOT NULL DEFAULT 4,
  height INT NOT NULL DEFAULT 2,
  config JSONB DEFAULT '{}', -- Configuración específica del widget
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_dashboard_widgets_user_org ON dashboard_widgets(user_id, organization_id);
CREATE INDEX idx_dashboard_widgets_user ON dashboard_widgets(user_id);
CREATE INDEX idx_dashboard_widgets_org ON dashboard_widgets(organization_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Políticas de seguridad RLS
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios widgets
CREATE POLICY "Users can view their own dashboard widgets"
  ON dashboard_widgets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propios widgets
CREATE POLICY "Users can insert their own dashboard widgets"
  ON dashboard_widgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propios widgets
CREATE POLICY "Users can update their own dashboard widgets"
  ON dashboard_widgets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios widgets
CREATE POLICY "Users can delete their own dashboard widgets"
  ON dashboard_widgets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE dashboard_widgets IS 'Almacena la configuración personalizada de widgets del dashboard por usuario';
COMMENT ON COLUMN dashboard_widgets.widget_type IS 'Tipo de widget: metrics, sales_chart, recent_orders, demographics, monthly_target, statistics, etc.';
COMMENT ON COLUMN dashboard_widgets.position_x IS 'Posición X en el grid (0-11)';
COMMENT ON COLUMN dashboard_widgets.position_y IS 'Posición Y en el grid';
COMMENT ON COLUMN dashboard_widgets.width IS 'Ancho del widget en columnas (1-12)';
COMMENT ON COLUMN dashboard_widgets.height IS 'Altura del widget en filas';
COMMENT ON COLUMN dashboard_widgets.config IS 'Configuración específica del widget en formato JSON';
