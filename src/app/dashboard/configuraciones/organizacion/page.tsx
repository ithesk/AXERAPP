"use client";

import { useState } from "react";
import { Building2, Users } from "lucide-react";
import { OrgSettings } from "@/components/organizations/OrgSettings";
import { MemberManagement } from "@/components/organizations/MemberManagement";

type TabType = "settings" | "members";

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("settings");

  const tabs = [
    {
      id: "settings" as TabType,
      label: "Configuración",
      icon: Building2,
    },
    {
      id: "members" as TabType,
      label: "Miembros",
      icon: Users,
    },
  ];

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "settings" && <OrgSettings />}
        {activeTab === "members" && <MemberManagement />}
      </div>
    </div>
  );
}
