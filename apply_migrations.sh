#!/bin/bash

# =====================================================
# Script para aplicar migraciones sin Supabase CLI
# =====================================================

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Aplicando Migraciones Multi-Tenant AXER       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Verificar que DATABASE_URL está configurado
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ ERROR: DATABASE_URL no está configurado${NC}"
  echo ""
  echo "Por favor configura DATABASE_URL con la connection string de Supabase:"
  echo "  export DATABASE_URL='postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres'"
  echo ""
  echo "Puedes obtenerla de:"
  echo "  Supabase Dashboard > Settings > Database > Connection string"
  echo ""
  exit 1
fi

# Directorio de migraciones
MIGRATIONS_DIR="supabase/migrations"

# Lista de migraciones en orden
MIGRATIONS=(
  "20251018095000_create_handle_updated_at_function.sql"
  "20251018090000_cleanup_existing_policies.sql"
  "20251018100000_create_organizations_table.sql"
  "20251018110000_create_org_members_table.sql"
  "20251018120000_create_invitations_table.sql"
  "20251018130000_create_subscription_plans_table.sql"
  "20251018140000_create_org_settings_table.sql"
  "20251018150000_create_audit_logs_table.sql"
  "20251018160000_alter_profiles_add_org_relation.sql"
  "20251018170000_alter_entradas_add_org_id.sql"
  "20251018180000_create_generate_entrada_id_function.sql"
  "20251018190000_create_rls_helper_functions.sql"
  "20251018200000_update_entradas_rls_policies.sql"
  "20251018310000_restore_multi_tenant_security.sql"
)

# Contador
TOTAL=${#MIGRATIONS[@]}
CURRENT=0
ERRORS=0

echo -e "${YELLOW}Aplicando $TOTAL migraciones...${NC}"
echo ""

# Aplicar cada migración
for migration in "${MIGRATIONS[@]}"; do
  CURRENT=$((CURRENT + 1))
  echo -e "${YELLOW}[$CURRENT/$TOTAL] Aplicando: $migration${NC}"

  FILE="$MIGRATIONS_DIR/$migration"

  if [ ! -f "$FILE" ]; then
    echo -e "${RED}  ❌ Archivo no encontrado: $FILE${NC}"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Aplicar migración
  if psql "$DATABASE_URL" -f "$FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Aplicada exitosamente${NC}"
  else
    echo -e "${RED}  ❌ Error al aplicar${NC}"
    echo -e "${YELLOW}  Reintentando con output detallado...${NC}"
    psql "$DATABASE_URL" -f "$FILE"
    ERRORS=$((ERRORS + 1))
  fi

  echo ""
done

# Resumen
echo "╔══════════════════════════════════════════════════╗"
if [ $ERRORS -eq 0 ]; then
  echo -e "║  ${GREEN}✅ TODAS LAS MIGRACIONES APLICADAS${NC}              ║"
else
  echo -e "║  ${RED}❌ $ERRORS MIGRACIONES CON ERRORES${NC}                   ║"
fi
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}Próximos pasos:${NC}"
  echo "  1. Ejecutar: psql \$DATABASE_URL -f supabase/migrations/verify_migration.sql"
  echo "  2. Continuar con Fase 2: TypeScript Types"
  echo ""
else
  echo -e "${RED}Revisa los errores arriba y vuelve a intentar${NC}"
  echo ""
  exit 1
fi
