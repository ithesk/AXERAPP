"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, FolderTree, Package, Tags } from "lucide-react";
import ProductsList from "@/components/products/ProductsList";
import BrandsManager from "@/components/products/BrandsManager";
import CategoriesManager from "@/components/products/CategoriesManager";
import TagsManager from "@/components/products/TagsManager";

type TabType = "products" | "brands" | "categories" | "tags";

export default function ProductosPage() {
  const [activeTab, setActiveTab] = useState<TabType>("products");

  const tabs: Array<{ id: TabType; label: string; icon: LucideIcon }> = [
    { id: "products", label: "Productos", icon: Package },
    { id: "brands", label: "Marcas", icon: BadgeCheck },
    { id: "categories", label: "Categorías", icon: FolderTree },
    { id: "tags", label: "Etiquetas", icon: Tags },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Navigation n */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon as LucideIcon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }
                `}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive
                      ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                  }`}
                  strokeWidth={1.75}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "products" && <ProductsList />}
        {activeTab === "brands" && <BrandsManager />}
        {activeTab === "categories" && <CategoriesManager />}
        {activeTab === "tags" && <TagsManager />}
      </div>
    </div>
  );
}
