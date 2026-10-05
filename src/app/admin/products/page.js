"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  AlertCircle,
  X,
  UploadCloud,
} from "lucide-react";

import { get, put, del } from "@/lib/api";

const CATEGORIES = ["All", "Clothing", "Home & Living", "Toys"];

const CATEGORY_IDS = {
  Clothing: 1,
  "Home & Living": 2,
  Toys: 3,
};

const EMPTY_FORM = {
  name: "",
  category: "Clothing",
  price: "",
  image: "",
  isAvailable: true,
};

function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
 * Converts the backend product format into the format
 * expected by this page.
 *
 * Backend example:
 * category: {
 *   id: 1,
 *   name: "Clothing",
 *   slug: "clothing",
 *   ...
 * }
 *
 * Frontend display:
 * category: "Clothing"
 */
function normalizeProduct(product) {
  if (!product) return null;

  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? product.category.name
      : product.category;

  return {
    ...product,

    id: product.id,
    name: product.name || "",
    category: categoryName || "Uncategorized",
    price: Number(product.price ?? 0),

    image:
      product.image_url ||
      product.image ||
      "",

    isAvailable:
      product.availability ??
      product.is_available ??
      false,
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ------------------------------------------------------------
  // Load products from backend
  // ------------------------------------------------------------

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await get(
        "/api/admin/products?page=1&limit=100"
      );

      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];

      setProducts(items.map(normalizeProduct));
    } catch (err) {
      console.error("Failed to load admin products:", err);

      setError(
        err.message || "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ------------------------------------------------------------
  // Filtering
  // ------------------------------------------------------------

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // ------------------------------------------------------------
  // Modal helpers
  // ------------------------------------------------------------

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ ...EMPTY_FORM });
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);

    setFormData({
      name: "",
      category: "Clothing",
      price: "",
      image: "",
      isAvailable: true,
    });

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || "",

      category:
        typeof product.category === "object"
          ? product.category.name
          : product.category || "Clothing",

      price:
        product.price !== undefined && product.price !== null
          ? product.price
          : "",

      image:
        product.image_url ||
        product.image ||
        "",

      isAvailable:
        product.availability ??
        product.isAvailable ??
        false,
    });

    setIsModalOpen(true);
  };

  // ------------------------------------------------------------
  // Image preview
  // ------------------------------------------------------------

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setFormData((current) => ({
      ...current,
      image: previewUrl,
    }));
  };

  // ------------------------------------------------------------
  // SAVE / UPDATE PRODUCT
  // ------------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    /*
     * Add Product API will be connected after we verify
     * its exact Swagger request schema.
     */
    if (!editingProduct) {
      alert(
        "Add Product API integration will be connected next."
      );
      return;
    }

    try {
      setSaving(true);

      const categoryId =
        CATEGORY_IDS[formData.category] ||
        editingProduct.category?.id ||
        editingProduct.category_id;

      if (!categoryId) {
        throw new Error(
          "Could not determine the product category."
        );
      }

      const payload = {
        category_id: Number(categoryId),

        name: formData.name.trim(),

        /*
         * Keep the existing slug when possible.
         * Otherwise generate one from the product name.
         */
        slug:
          editingProduct.slug ||
          makeSlug(formData.name),

        price: Number(formData.price),

        description:
          editingProduct.description || "",

        details:
          editingProduct.details || "",

        material:
          editingProduct.material || "",

        dimensions:
          editingProduct.dimensions ||
          editingProduct.size ||
          "",

        colour:
          editingProduct.colour || "",

        care:
          editingProduct.care || "",

        badge:
          editingProduct.badge || "",

        availability:
          Boolean(formData.isAvailable),

        image_url:
          formData.image ||
          editingProduct.image_url ||
          editingProduct.image ||
          "",
      };

      console.log(
        "Updating product with payload:",
        payload
      );

      const updatedProduct = await put(
        `/api/admin/products/${editingProduct.id}`,
        payload
      );

      const normalizedUpdatedProduct =
        normalizeProduct(updatedProduct);

      setProducts((current) =>
        current.map((product) =>
          product.id === editingProduct.id
            ? normalizedUpdatedProduct
            : product
        )
      );

      closeModal();

      alert("Product updated successfully.");
    } catch (err) {
      console.error(
        "Update product failed:",
        err
      );

      alert(
        err.message ||
          "Failed to update product."
      );
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // DELETE / DEACTIVATE PRODUCT
  // ------------------------------------------------------------

  const handleDeleteProduct = async (id) => {
    const product = products.find(
      (item) => item.id === id
    );

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${product?.name || "this product"}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await del(
        `/api/admin/products/${id}`
      );

      setProducts((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      alert("Product deactivated successfully.");
    } catch (err) {
      console.error(
        "Delete/deactivate product failed:",
        err
      );

      alert(
        err.message ||
          "Failed to deactivate product."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#F8F6F2] text-[#1D1D1B]">

      {/* Header */}
      <header className="border-b border-[#E5E0D8] bg-white px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-semibold">
              Products
            </h1>

            <p className="mt-1 text-sm text-[#77736D]">
              Manage catalog, inventory visibility, and pricing
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A85838] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8f4a2e]"
          >
            <Plus size={18} />
            Add Product
          </button>

        </div>
      </header>

      <div className="p-5 sm:p-6 lg:p-8">

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />

            <div>
              <p className="font-semibold">
                Failed to load products
              </p>

              <p className="mt-1">
                {error}
              </p>

              <button
                onClick={loadProducts}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative flex-1 max-w-md">

            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#99948C]"
              size={18}
            />

            <input
              type="text"
              placeholder="Search products by title..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              className="w-full rounded-xl border border-[#E8E2D9] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#C9A227]"
            />

          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">

            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(category)
                }
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                  selectedCategory === category
                    ? "bg-[#C9A227] text-white"
                    : "border border-[#E8E2D9] bg-white text-[#77736D] hover:bg-[#FAF8F3]"
                }`}
              >
                {category}
              </button>
            ))}

          </div>

        </div>

        {/* Product Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white shadow-sm">

          {loading ? (
            <div className="flex items-center justify-center p-16 text-sm text-[#77736D]">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (

            <div className="flex flex-col items-center justify-center p-12 text-center">

              <AlertCircle
                size={40}
                className="mb-3 text-[#99948C]"
              />

              <h3 className="text-base font-semibold">
                No products found
              </h3>

              <p className="mt-1 text-sm text-[#77736D]">
                Try adjusting your search criteria or create a new product.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="border-b border-[#EEE9E2] bg-[#FAF8F3] text-xs uppercase tracking-wide text-[#77736D]">

                  <tr>

                    <th className="px-6 py-4 font-medium">
                      Item
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Category
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Price
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Availability
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-[#F0ECE6]">

                  {filteredProducts.map((item) => (

                    <tr
                      key={item.id}
                      className="hover:bg-[#FAF8F3]/50"
                    >

                      {/* Product */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#E8E2D9] bg-[#F8F6F2]">

                            {item.image ? (

                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />

                            ) : (

                              <div className="flex h-full w-full items-center justify-center text-[#99948C]">
                                <ImageIcon size={20} />
                              </div>

                            )}

                          </div>

                          <div>

                            <p className="font-medium text-[#1D1D1B]">
                              {item.name}
                            </p>

                            <p className="text-xs text-[#99948C]">
                              ID: {item.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-[#55514B]">
                        {item.category || "Uncategorized"}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 font-medium">
                        ₹
                        {Number(item.price || 0).toFixed(2)}
                      </td>

                      {/* Availability */}
                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            item.isAvailable
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >

                          {item.isAvailable ? (
                            <>
                              <CheckCircle2 size={13} />
                              In Stock
                            </>
                          ) : (
                            <>
                              <XCircle size={13} />
                              Unavailable
                            </>
                          )}

                        </span>

                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">

                        <div className="flex items-center justify-end gap-2">

                          <button
                            onClick={() =>
                              handleOpenEditModal(item)
                            }
                            className="rounded-lg p-2 text-[#77736D] transition hover:bg-[#F2E7C2] hover:text-[#A85838]"
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteProduct(item.id)
                            }
                            disabled={
                              deletingId === item.id
                            }
                            className="rounded-lg p-2 text-[#77736D] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Deactivate Product"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EEE9E2] pb-4">

              <h2 className="text-lg font-semibold">
                {editingProduct
                  ? "Edit Product"
                  : "Add New Product"}
              </h2>

              <button
                onClick={closeModal}
                className="text-[#99948C] hover:text-[#1D1D1B]"
              >
                <X size={20} />
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-4"
            >

              {/* Name */}
              <div>

                <label className="mb-1 block text-xs font-semibold text-[#55514B]">
                  Product Name
                </label>

                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#E8E2D9] px-3.5 py-2 text-sm outline-none focus:border-[#C9A227]"
                  placeholder="e.g. Handwoven Cotton Saree"
                />

              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="mb-1 block text-xs font-semibold text-[#55514B]">
                    Category
                  </label>

                  <select
                    value={formData.category}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        category: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#E8E2D9] px-3 py-2 text-sm outline-none focus:border-[#C9A227]"
                  >

                    <option value="Clothing">
                      Clothing
                    </option>

                    <option value="Home & Living">
                      Home & Living
                    </option>

                    <option value="Toys">
                      Toys
                    </option>

                  </select>

                </div>

                <div>

                  <label className="mb-1 block text-xs font-semibold text-[#55514B]">
                    Price (₹)
                  </label>

                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        price: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#E8E2D9] px-3.5 py-2 text-sm outline-none focus:border-[#C9A227]"
                    placeholder="999"
                  />

                </div>

              </div>

              {/* Image */}
              <div>

                <label className="mb-1 block text-xs font-semibold text-[#55514B]">
                  Product Image
                </label>

                <div className="flex items-center gap-3">

                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E8E2D9] bg-[#F8F6F2]">

                    {formData.image ? (

                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <div className="flex h-full w-full items-center justify-center text-[#99948C]">
                        <ImageIcon size={20} />
                      </div>

                    )}

                  </div>

                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#C9A227] bg-[#FAF8F3] px-3 py-2.5 text-xs font-medium text-[#A85838] transition hover:bg-[#F2E7C2]/40">

                    <UploadCloud size={16} />

                    <span>
                      Upload device image
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                  </label>

                </div>

                <input
                  type="text"
                  value={formData.image}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      image: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-[#E8E2D9] px-3.5 py-1.5 text-xs outline-none focus:border-[#C9A227]"
                  placeholder="Or enter path: /products/saree-pink-purple-1.jpeg"
                />

              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 pt-1">

                <input
                  type="checkbox"
                  id="availability"
                  checked={formData.isAvailable}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      isAvailable:
                        event.target.checked,
                    })
                  }
                  className="rounded border-[#E8E2D9] accent-[#A85838]"
                />

                <label
                  htmlFor="availability"
                  className="text-sm text-[#55514B]"
                >
                  Mark as In Stock / Active
                </label>

              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-[#EEE9E2] pt-4">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-[#E8E2D9] px-4 py-2 text-sm font-medium text-[#77736D] hover:bg-[#FAF8F3] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#A85838] px-5 py-2 text-sm font-medium text-white hover:bg-[#8f4a2e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Save Changes"
                      : "Create Product"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}