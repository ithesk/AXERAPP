import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductsFilters,
} from "@/types/products";
import type { Tag } from "@/types/product-attributes";

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  createProduct: (data: CreateProductData) => Promise<{ success: boolean; error?: string; data?: Product }>;
  updateProduct: (id: string, data: UpdateProductData) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  searchProducts: (query: string) => Product[];
  refetch: () => void;
}

export function useProducts(filters?: ProductsFilters): UseProductsResult {
  const { currentOrg } = useOrganization();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapProduct = useCallback((raw: any): Product => {
    const { product_tags, ...rest } = raw;

    const relationTags: Tag[] = Array.isArray(product_tags)
      ? product_tags
          .map((relation: { tag?: Tag | null }) => relation?.tag)
          .filter((tag): tag is Tag => Boolean(tag))
      : [];

    const legacyTags: Tag[] = Array.isArray(product_tags)
      ? []
      : Array.isArray(raw.tags)
      ? raw.tags
          .filter(
            (tag: unknown): tag is string =>
              typeof tag === "string" && tag.trim().length > 0
          )
          .map((name: string, index: number) => ({
            id: `legacy-${raw.id ?? "product"}-${index}`,
            org_id: raw.org_id,
            name,
            color: "#94A3B8",
            description: null,
            is_active: true,
            created_at: "1970-01-01T00:00:00.000Z",
            updated_at: "1970-01-01T00:00:00.000Z",
            created_by: null,
          }))
      : [];

    const tags: Tag[] = [...relationTags, ...legacyTags];

    return {
      ...rest,
      tags,
    } as Product;
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!currentOrg) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      let query = supabase
        .from("products")
        .select(
          `
            *,
            brand:brands(*),
            category:categories(*),
            product_tags:product_tags(
              tag:tags(*)
            )
          `
        )
        .eq("org_id", currentOrg.id)
        .order("name", { ascending: true });

      // Aplicar filtros
      if (filters?.product_type) {
        query = query.eq("product_type", filters.product_type);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      if (filters?.track_inventory !== undefined) {
        query = query.eq("track_inventory", filters.track_inventory);
      }

      if (filters?.category_id) {
        query = query.eq("category_id", filters.category_id);
      }

      if (filters?.brand_id) {
        query = query.eq("brand_id", filters.brand_id);
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredData = (data || []).map(mapProduct);

      if (filters?.category) {
        const categoryName = filters.category.toLowerCase();
        filteredData = filteredData.filter((product) => {
          const productCategory =
            typeof product.category === "string"
              ? product.category
              : product.category?.name;
          return productCategory
            ?.toLowerCase()
            .includes(categoryName);
        });
      }

      if (filters?.brand) {
        const brandName = filters.brand.toLowerCase();
        filteredData = filteredData.filter((product) => {
          const productBrand =
            typeof product.brand === "string"
              ? product.brand
              : product.brand?.name;
          return productBrand?.toLowerCase().includes(brandName);
        });
      }

      if (filters?.tags && filters.tags.length > 0) {
        const tagNames = filters.tags.map((tag) => tag.toLowerCase());
        filteredData = filteredData.filter((product) => {
          const productTagNames = (product.tags || []).map((tag) =>
            tag.name.toLowerCase()
          );
          return tagNames.every((tag) => productTagNames.includes(tag));
        });
      }

      if (filters?.tag_ids && filters.tag_ids.length > 0) {
        filteredData = filteredData.filter((product) => {
          const productTagIds = (product.tags || [])
            .map((tag) => tag.id)
            .filter(Boolean);
          return filters.tag_ids!.every((id) => productTagIds.includes(id));
        });
      }

      // Filtro de stock bajo (se hace en cliente porque depende de comparación)
      if (filters?.low_stock) {
        filteredData = filteredData.filter(
          (p) => p.track_inventory && p.current_stock <= p.min_stock
        );
      }

      setProducts(filteredData);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err.message : "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [currentOrg, filters, mapProduct]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(
    async (payload: CreateProductData): Promise<{ success: boolean; error?: string; data?: Product }> => {
      if (!currentOrg) {
        const message = "No hay una organización seleccionada";
        setError(message);
        return { success: false, error: message };
      }

      try {
        setError(null);

        const supabase = createClient();
        const shouldTrackInventory = payload.track_inventory ?? false;

        const insertPayload = {
          org_id: currentOrg.id,
          name: payload.name,
          description: payload.description || null,
          sku: payload.sku || null,
          product_type: payload.product_type,
          sale_price: payload.sale_price,
          cost_price: payload.cost_price || 0,
          track_inventory: shouldTrackInventory,
          current_stock: shouldTrackInventory ? payload.current_stock || 0 : 0,
          min_stock: shouldTrackInventory ? payload.min_stock || 0 : 0,
          max_stock: shouldTrackInventory ? payload.max_stock ?? null : null,
          stock_unit: payload.stock_unit || "unidad",
          category_id: payload.category_id || null,
          brand_id: payload.brand_id || null,
          notes: payload.notes || null,
          image_url: payload.image_url || null,
          barcode: payload.barcode || null,
        };

        const { data, error: insertError } = await supabase
          .from("products")
          .insert([insertPayload])
          .select("id")
          .single();

        if (insertError) throw insertError;

        const insertedProduct = data as { id: string };

        const uniqueTagIds = Array.from(
          new Set(payload.tag_ids?.filter(Boolean) || [])
        );

        if (uniqueTagIds.length > 0) {
          const { data: allowedTags, error: tagsLookupError } = await supabase
            .from("tags")
            .select("id")
            .in("id", uniqueTagIds)
            .eq("org_id", currentOrg.id);

          if (tagsLookupError) throw tagsLookupError;

          const allowedIds = new Set((allowedTags ?? []).map((tag) => tag.id));
          const tagRelations = uniqueTagIds
            .filter((tagId) => allowedIds.has(tagId))
            .map((tagId) => ({
              product_id: insertedProduct.id,
              tag_id: tagId,
            }));

          if (tagRelations.length > 0) {
            const { error: tagsError } = await supabase
              .from("product_tags")
              .insert(tagRelations);

            if (tagsError) throw tagsError;
          }
        }

        const { data: productWithRelations, error: fetchError } = await supabase
          .from("products")
          .select(
            `
              *,
              brand:brands(*),
              category:categories(*),
              product_tags:product_tags(
                tag:tags(*)
              )
            `
          )
          .eq("id", insertedProduct.id)
          .eq("org_id", currentOrg.id)
          .single();

        if (fetchError) throw fetchError;

        const newProduct = mapProduct(productWithRelations);

        setProducts((prev) =>
          [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name))
        );

        return { success: true, data: newProduct };
      } catch (err) {
        console.error("Error creating product:", err);
        const message = err instanceof Error ? err.message : "Error al crear producto";
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentOrg, mapProduct]
  );

  const updateProduct = useCallback(
    async (id: string, updates: UpdateProductData): Promise<{ success: boolean; error?: string }> => {
      if (!currentOrg) {
        const message = "No hay una organización seleccionada";
        setError(message);
        return { success: false, error: message };
      }

      try {
        setError(null);

        const supabase = createClient();
        const updatePayload: Record<string, unknown> = {};

        // Solo incluir campos que se están actualizando
        if (updates.name !== undefined) updatePayload.name = updates.name;
        if (updates.description !== undefined)
          updatePayload.description = updates.description;
        if (updates.sku !== undefined) updatePayload.sku = updates.sku;
        if (updates.product_type !== undefined)
          updatePayload.product_type = updates.product_type;
        if (updates.sale_price !== undefined)
          updatePayload.sale_price = updates.sale_price;
        if (updates.cost_price !== undefined)
          updatePayload.cost_price = updates.cost_price;
        if (updates.track_inventory !== undefined)
          updatePayload.track_inventory = updates.track_inventory;
        if (updates.current_stock !== undefined)
          updatePayload.current_stock = updates.current_stock;
        if (updates.min_stock !== undefined)
          updatePayload.min_stock = updates.min_stock;
        if (updates.max_stock !== undefined)
          updatePayload.max_stock = updates.max_stock;
        if (updates.stock_unit !== undefined)
          updatePayload.stock_unit = updates.stock_unit;
        if (updates.category_id !== undefined)
          updatePayload.category_id = updates.category_id;
        if (updates.brand_id !== undefined)
          updatePayload.brand_id = updates.brand_id;
        if (updates.is_active !== undefined)
          updatePayload.is_active = updates.is_active;
        if (updates.notes !== undefined) updatePayload.notes = updates.notes;
        if (updates.image_url !== undefined)
          updatePayload.image_url = updates.image_url;
        if (updates.barcode !== undefined)
          updatePayload.barcode = updates.barcode;

        if (
          updates.track_inventory === false ||
          updates.product_type === "service"
        ) {
          updatePayload.current_stock = 0;
          updatePayload.min_stock = 0;
          updatePayload.max_stock = null;
        }

        const { error: updateError } = await supabase
          .from("products")
          .update(updatePayload)
          .eq("id", id)
          .eq("org_id", currentOrg.id);

        if (updateError) throw updateError;

        if (updates.tag_ids !== undefined) {
          const { error: deleteTagsError } = await supabase
            .from("product_tags")
            .delete()
            .eq("product_id", id);

          if (deleteTagsError) throw deleteTagsError;

          const uniqueTagIds = Array.from(
            new Set(updates.tag_ids.filter(Boolean))
          );

          if (uniqueTagIds.length > 0) {
            const { data: allowedTags, error: tagsLookupError } = await supabase
              .from("tags")
              .select("id")
              .in("id", uniqueTagIds)
              .eq("org_id", currentOrg.id);

            if (tagsLookupError) throw tagsLookupError;

            const allowedIds = new Set((allowedTags ?? []).map((tag) => tag.id));
            const tagRelations = uniqueTagIds
              .filter((tagId) => allowedIds.has(tagId))
              .map((tagId) => ({
                product_id: id,
                tag_id: tagId,
              }));

            if (tagRelations.length > 0) {
              const { error: insertTagsError } = await supabase
                .from("product_tags")
                .insert(tagRelations);

              if (insertTagsError) throw insertTagsError;
            }
          }
        }

        const { data: refreshedProduct, error: fetchError } = await supabase
          .from("products")
          .select(
            `
              *,
              brand:brands(*),
              category:categories(*),
              product_tags:product_tags(
                tag:tags(*)
              )
            `
          )
          .eq("id", id)
          .eq("org_id", currentOrg.id)
          .single();

        if (fetchError) throw fetchError;

        const updatedProduct = mapProduct(refreshedProduct);
        setProducts((prev) =>
          prev
            .map((p) => (p.id === id ? updatedProduct : p))
            .sort((a, b) => a.name.localeCompare(b.name))
        );

        return { success: true };
      } catch (err) {
        console.error("Error updating product:", err);
        const message = err instanceof Error ? err.message : "Error al actualizar producto";
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentOrg, mapProduct]
  );

  const deleteProduct = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!currentOrg) {
        const message = "No hay una organización seleccionada";
        setError(message);
        return { success: false, error: message };
      }

      try {
        setError(null);

        const supabase = createClient();
        const { error: deleteError } = await supabase
          .from("products")
          .delete()
          .eq("id", id)
          .eq("org_id", currentOrg.id);

        if (deleteError) throw deleteError;

        setProducts((prev) => prev.filter((p) => p.id !== id));

        return { success: true };
      } catch (err) {
        console.error("Error deleting product:", err);
        const message = err instanceof Error ? err.message : "Error al eliminar producto";
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentOrg]
  );

  const searchProducts = useCallback(
    (query: string): Product[] => {
      if (!query.trim()) return products;

      const searchTerm = query.toLowerCase();
      return products.filter((product) => {
        const brandName =
          typeof product.brand === "string"
            ? product.brand
            : product.brand?.name;
        const categoryName =
          typeof product.category === "string"
            ? product.category
            : product.category?.name;
        const tagNames = (product.tags || []).map((tag) => tag.name);

        return [
          product.name,
          product.sku,
          product.description,
          brandName,
          categoryName,
          ...tagNames,
        ]
          .filter(Boolean)
          .some((value) =>
            value!.toString().toLowerCase().includes(searchTerm)
          );
      });
    },
    [products]
  );

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    refetch: fetchProducts,
  };
}
