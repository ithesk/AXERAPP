"use client";

import OdooConnectionManager from "@/components/integrations/OdooConnectionManager";

export default function ERPIntegrationPage() {
  return (
    <div className="space-y-6">
      <OdooConnectionManager />
    </div>
  );
}
