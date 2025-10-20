"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { useBrands } from "@/hooks/useBrands";
import { useCategories } from "@/hooks/useCategories";
import { useTags } from "@/hooks/useTags";
import AttributeCombobox, {
  type AttributeOption,
} from "@/components/products/AttributeCombobox";
import TagMultiSelect, {
  type TagSelection,
} from "@/components/products/TagMultiSelect";
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductType,
} from "@/types/products";
import { PRODUCT_TYPE_LABELS, STOCK_UNITS } from "@/types/products";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  onSubmit: (
    data: CreateProductData | UpdateProductData
  ) => Promise<{ success: boolean; error?: string }>;
  initialData?: Product | null;
  initialName?: string;
  initialType?: ProductType;
}

type AttributeSelection = {
  id: string | null;
  name: string;
};

type FormState = {
  name: string;
  description: string;
  sku: string;
  product_type: ProductType;
  sale_price: number;
  cost_price: number;
  track_inventory: boolean;
  current_stock: number;
  min_stock: number;
  max_stock: string; // String para permitir vacío
  stock_unit: string;
  category: AttributeSelection;
  brand: AttributeSelection;
  tags: TagSelection[];
  notes: string;
  barcode: string;
};

const buildDefaultState = (overrides?: Partial<FormState>): FormState => ({
  name: "",
  description: "",
  sku: "",
  product_type: "part",
  sale_price: 0,
  cost_price: 0,
  track_inventory: false,
  current_stock: 0,
  min_stock: 0,
  max_stock: "",
  stock_unit: "unidad",
  category: { id: null, name: "" },
  brand: { id: null, name: "" },
  tags: [],
  notes: "",
  barcode: "",
  ...overrides,
});

export default function ProductModal({
  isOpen,
  onClose,
  mode,
  onSubmit,
  initialData,
  initialName,
  initialType,
}: ProductModalProps) {
  const [formState, setFormState] = useState<FormState>(() => buildDefaultState());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && mode === "edit") {
      const brandRelation = (initialData as any).brand;
      const categoryRelation = (initialData as any).category;
      const rawTags = (initialData as any).tags;

      const brandName =
        typeof brandRelation === "string"
          ? brandRelation
          : brandRelation?.name ?? "";
      const brandId =
        initialData.brand_id ??
        (typeof brandRelation === "object" && brandRelation
          ? brandRelation.id ?? null
          : null);

      const categoryName =
        typeof categoryRelation === "string"
          ? categoryRelation
          : categoryRelation?.name ?? "";
      const categoryId =
        initialData.category_id ??
        (typeof categoryRelation === "object" && categoryRelation
          ? categoryRelation.id ?? null
          : null);

      const tagItems: TagSelection[] = Array.isArray(rawTags)
        ? rawTags.map((tag: any) => {
            if (!tag) return { id: null, name: "" };
            if (typeof tag === "string") {
              return { id: null, name: tag };
            }
            return {
              id: tag.id ?? null,
              name: tag.name ?? "",
              color: tag.color ?? undefined,
            };
          })
        : [];

      const initialTrackInventory =
        initialData.product_type === "service"
          ? false
          : initialData.track_inventory;

      setFormState(
        buildDefaultState({
          name: initialData.name,
          description: initialData.description || "",
          sku: initialData.sku || "",
          product_type: initialData.product_type,
          sale_price: initialData.sale_price,
          cost_price: initialData.cost_price,
          track_inventory: initialTrackInventory,
          current_stock: initialData.current_stock,
          min_stock: initialData.min_stock,
          max_stock: initialData.max_stock?.toString() || "",
          stock_unit: initialData.stock_unit,
          category: { id: categoryId, name: categoryName },
          brand: { id: brandId, name: brandName },
          tags: tagItems.filter((tag) => tag.name),
          notes: initialData.notes || "",
          barcode: initialData.barcode || "",
        })
      );
    } else {
      // Modo crear: usar initialName y initialType si están disponibles
      setFormState(
        buildDefaultState({
          name: initialName || "",
          product_type: initialType || "part",
        })
      );
    }
  }, [initialData, mode, isOpen, initialName, initialType]);

  const modalTitle = mode === "edit" ? "Editar producto" : "Nuevo producto";
  const submitLabel = mode === "edit" ? "Guardar cambios" : "Crear producto";

  const { showToast } = useToast();
  const { brands, loading: brandsLoading, createBrand } = useBrands();
  const {
    categories,
    loading: categoriesLoading,
    createCategory,
  } = useCategories();
  const {
    tags: availableTags,
    loading: tagsLoading,
    createTag,
  } = useTags();

  const brandOptions = useMemo<AttributeOption[]>(
    () => brands.map((brand) => ({ id: brand.id, name: brand.name })),
    [brands]
  );

  const categoryOptions = useMemo<AttributeOption[]>(
    () => categories.map((category) => ({ id: category.id, name: category.name })),
    [categories]
  );

  const tagOptions = useMemo<TagSelection[]>(
    () =>
      availableTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
    [availableTags]
  );

  const handleBrandInputChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      brand: { id: null, name: value },
    }));
  };

  const handleBrandSelect = (option: AttributeOption) => {
    setFormState((prev) => ({
      ...prev,
      brand: { id: option.id, name: option.name },
    }));
  };

  const handleBrandClear = () => {
    setFormState((prev) => ({
      ...prev,
      brand: { id: null, name: "" },
    }));
  };

  const handleCategoryInputChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      category: { id: null, name: value },
    }));
  };

  const handleCategorySelect = (option: AttributeOption) => {
    setFormState((prev) => ({
      ...prev,
      category: { id: option.id, name: option.name },
    }));
  };

  const handleCategoryClear = () => {
    setFormState((prev) => ({
      ...prev,
      category: { id: null, name: "" },
    }));
  };

  const handleTagsChange = (tags: TagSelection[]) => {
    setFormState((prev) => ({
      ...prev,
      tags,
    }));
  };

  const handleCreateBrandOption = async (
    name: string
  ): Promise<AttributeOption | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const result = await createBrand({ name: trimmed });
    if (!result.success || !result.data) {
      showToast(
        "error",
        "Error",
        result.error || "No se pudo crear la marca"
      );
      return null;
    }

    showToast("success", "Marca creada", `"${result.data.name}" ahora está disponible`);
    return { id: result.data.id, name: result.data.name };
  };

  const handleCreateCategoryOption = async (
    name: string
  ): Promise<AttributeOption | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const result = await createCategory({ name: trimmed });
    if (!result.success || !result.data) {
      showToast(
        "error",
        "Error",
        result.error || "No se pudo crear la categoría"
      );
      return null;
    }

    showToast(
      "success",
      "Categoría creada",
      `"${result.data.name}" lista para usarse`
    );
    return { id: result.data.id, name: result.data.name };
  };

  const handleCreateTagOption = async (
    name: string
  ): Promise<TagSelection | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const result = await createTag({ name: trimmed });
    if (!result.success || !result.data) {
      showToast(
        "error",
        "Error",
        result.error || "No se pudo crear la etiqueta"
      );
      return null;
    }

    showToast(
      "success",
      "Etiqueta creada",
      `"${result.data.name}" añadida al catálogo`
    );
    return {
      id: result.data.id,
      name: result.data.name,
      color: result.data.color,
    };
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === "product_type") {
      setFormState((prev) => ({
        ...prev,
        product_type: value as ProductType,
        track_inventory: value === "service" ? false : prev.track_inventory,
      }));
      return;
    }

    setFormState((prev) => {
      const key = name as keyof FormState;

      if (type === "checkbox") {
        return {
          ...prev,
          [key]: checked,
        } as FormState;
      }

      if (type === "number" && key !== "max_stock") {
        return {
          ...prev,
          [key]: value === "" ? 0 : Number(value),
        } as FormState;
      }

      return {
        ...prev,
        [key]: value,
      } as FormState;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formState.name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    if (formState.sale_price < 0) {
      setError("El precio de venta debe ser mayor o igual a 0");
      return;
    }

    setSaving(true);
    setError(null);

    const toOptional = (value: string) => {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    };

    const toNullable = (value: string) => {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    };

    const brandNameInput = formState.brand.name.trim();
    let brandId = formState.brand.id;
    let brandName = brandNameInput;

    if (!brandId && brandName) {
      const existingBrand = brandOptions.find(
        (option) => option.name.toLowerCase() === brandName.toLowerCase()
      );

      if (existingBrand) {
        brandId = existingBrand.id;
        brandName = existingBrand.name;
        setFormState((prev) => ({
          ...prev,
          brand: { id: existingBrand.id, name: existingBrand.name },
        }));
      } else {
        const created = await handleCreateBrandOption(brandName);
        if (created) {
          brandId = created.id;
          brandName = created.name;
          setFormState((prev) => ({
            ...prev,
            brand: { id: created.id, name: created.name },
          }));
        }
      }
    }

    const categoryNameInput = formState.category.name.trim();
    let categoryId = formState.category.id;
    let categoryName = categoryNameInput;

    if (!categoryId && categoryName) {
      const existingCategory = categoryOptions.find(
        (option) => option.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (existingCategory) {
        categoryId = existingCategory.id;
        categoryName = existingCategory.name;
        setFormState((prev) => ({
          ...prev,
          category: { id: existingCategory.id, name: existingCategory.name },
        }));
      } else {
        const created = await handleCreateCategoryOption(categoryName);
        if (created) {
          categoryId = created.id;
          categoryName = created.name;
          setFormState((prev) => ({
            ...prev,
            category: { id: created.id, name: created.name },
          }));
        }
      }
    }
    const tagNames = formState.tags
      .map((tag) => tag.name.trim())
      .filter((tag) => tag.length > 0);
    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      );

    const tagIds = formState.tags
      .map((tag) => tag.id)
      .filter((id): id is string => typeof id === "string" && isUuid(id));
    const isService = formState.product_type === "service";
    const trackInventory = !isService && formState.track_inventory;
    const hasMaxStockValue = formState.max_stock.trim() !== "";
    const maxStockNumber = Number(formState.max_stock);
    const parsedMaxStock =
      hasMaxStockValue && Number.isFinite(maxStockNumber)
        ? maxStockNumber
        : undefined;

    const isEdit = mode === "edit";

    const payload: CreateProductData | UpdateProductData = isEdit
      ? {
          name: formState.name.trim(),
          description: toNullable(formState.description),
          sku: toNullable(formState.sku),
          product_type: formState.product_type,
          sale_price: formState.sale_price,
          cost_price: formState.cost_price,
          track_inventory: trackInventory,
          current_stock: trackInventory ? formState.current_stock : undefined,
          min_stock: trackInventory ? formState.min_stock : undefined,
          max_stock: trackInventory
            ? hasMaxStockValue
              ? parsedMaxStock ?? null
              : null
            : null,
          stock_unit: formState.stock_unit,
          category_id: categoryId ?? null,
          brand_id: brandId ?? null,
          tag_ids: tagIds,
          category: categoryName ? categoryName : null,
          brand: brandName ? brandName : null,
          tags: tagNames,
          notes: toNullable(formState.notes),
          barcode: toNullable(formState.barcode),
        }
      : {
          name: formState.name.trim(),
          description: toOptional(formState.description),
          sku: toOptional(formState.sku),
          product_type: formState.product_type,
          sale_price: formState.sale_price,
          cost_price: formState.cost_price,
          track_inventory: trackInventory,
          current_stock: trackInventory ? formState.current_stock : undefined,
          min_stock: trackInventory ? formState.min_stock : undefined,
          max_stock:
            trackInventory && hasMaxStockValue ? parsedMaxStock : undefined,
          stock_unit: formState.stock_unit,
          category_id: categoryId || undefined,
          brand_id: brandId || undefined,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
          category: categoryName || undefined,
          brand: brandName || undefined,
          tags: tagNames.length > 0 ? tagNames : undefined,
          notes: toOptional(formState.notes),
          barcode: toOptional(formState.barcode),
        };

    const result = await onSubmit(payload);

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Ocurrió un error al guardar el producto");
      return;
    }

    onClose();
    setFormState(buildDefaultState());
  };

  const isService = formState.product_type === "service";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl m-4">
      <div className="w-full p-6 overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh]">
        <div className="mb-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {modalTitle}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isService
              ? "Servicio o mano de obra (no afecta inventario)"
              : "Producto almacenable (afecta inventario)"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de producto */}
          <div>
            <label className="block mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de producto <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input
                  type="radio"
                  name="product_type"
                  value="part"
                  checked={formState.product_type === "part"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {PRODUCT_TYPE_LABELS.part}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pieza o producto almacenable
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input
                  type="radio"
                  name="product_type"
                  value="service"
                  checked={formState.product_type === "service"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {PRODUCT_TYPE_LABELS.service}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Servicio o mano de obra
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Información básica */}
          <div>
            <h5 className="mb-3 text-sm font-semibold text-gray-800 uppercase dark:text-white/70">
              Información básica
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Pantalla LCD, Instalación de pantalla..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  SKU / Código
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formState.sku}
                  onChange={handleInputChange}
                  placeholder="Ej: LCD-001"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código de barras
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formState.barcode}
                  onChange={handleInputChange}
                  placeholder="Ej: 123456789012"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Descripción detallada del producto..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>

          {/* Categorización */}
          <div>
            <h5 className="mb-3 text-sm font-semibold text-gray-800 uppercase dark:text-white/70">
              Categorización
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AttributeCombobox
                label="Marca"
                placeholder="Buscar o crear marca..."
                helperText="Mantén tus productos organizados por fabricante"
                inputValue={formState.brand.name}
                selectedOption={
                  formState.brand.id
                    ? { id: formState.brand.id, name: formState.brand.name }
                    : null
                }
                options={brandOptions}
                optionsLoading={brandsLoading}
                onInputChange={handleBrandInputChange}
                onSelectOption={handleBrandSelect}
                onClear={handleBrandClear}
                onCreateOption={handleCreateBrandOption}
              />

              <AttributeCombobox
                label="Categoría"
                placeholder="Ej: Pantallas, Baterías..."
                helperText="Agrupa productos similares para filtrar más rápido"
                inputValue={formState.category.name}
                selectedOption={
                  formState.category.id
                    ? {
                        id: formState.category.id,
                        name: formState.category.name,
                      }
                    : null
                }
                options={categoryOptions}
                optionsLoading={categoriesLoading}
                onInputChange={handleCategoryInputChange}
                onSelectOption={handleCategorySelect}
                onClear={handleCategoryClear}
                onCreateOption={handleCreateCategoryOption}
              />

              <div className="md:col-span-2">
                <TagMultiSelect
                  label="Etiquetas"
                  helperText="Agrega palabras clave para mejorar la búsqueda"
                  selectedTags={formState.tags}
                  availableTags={tagOptions}
                  loading={tagsLoading}
                  onChange={handleTagsChange}
                  onCreateTag={handleCreateTagOption}
                />
              </div>
            </div>
          </div>

          {/* Precios */}
          <div>
            <h5 className="mb-3 text-sm font-semibold text-gray-800 uppercase dark:text-white/70">
              Precios
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Precio de venta <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    name="sale_price"
                    value={formState.sale_price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Precio de costo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    name="cost_price"
                    value={formState.cost_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Inventario (solo para piezas) */}
          {!isService && (
            <div>
              <h5 className="mb-3 text-sm font-semibold text-gray-800 uppercase dark:text-white/70">
                Control de Inventario
              </h5>

              <label className="flex items-center gap-3 p-4 mb-4 border border-gray-200 rounded-xl dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input
                  type="checkbox"
                  name="track_inventory"
                  checked={formState.track_inventory}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    Controlar inventario
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Activar seguimiento de stock para este producto
                  </p>
                </div>
              </label>

              {formState.track_inventory && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stock actual
                    </label>
                    <input
                      type="number"
                      name="current_stock"
                      value={formState.current_stock}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stock mínimo
                    </label>
                    <input
                      type="number"
                      name="min_stock"
                      value={formState.min_stock}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stock máximo
                    </label>
                    <input
                      type="number"
                      name="max_stock"
                      value={formState.max_stock}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unidad de medida
                    </label>
                    <select
                      name="stock_unit"
                      value={formState.stock_unit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    >
                      {STOCK_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Notas internas
            </label>
            <textarea
              name="notes"
              value={formState.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Observaciones internas, especificaciones técnicas, etc."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/40">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Guardando..." : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
