"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Tags, X, AlertCircle } from "lucide-react";
import { get, post, put, del } from "@/lib/api";

const INITIAL_CATEGORIES = [
  {
    id: "cat_1",
    name: "Clothing",
    description: "Sarees, handwoven garments, and apparel",
    productCount: 1,
    isActive: true,
  },
  {
    id: "cat_2",
    name: "Home & Living",
    description: "Handcrafted baskets, decor, and daily utility",
    productCount: 1,
    isActive: true,
  },
  {
    id: "cat_3",
    name: "Toys",
    description: "Eco-friendly wooden toys and traditional play items",
    productCount: 0,
    isActive: true,
  },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
  const loadCategories = async () => {
    try {
      const data = await get("/api/admin/categories");

      setCategories(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  loadCategories();
}, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
  if (!confirm("Are you sure you want to remove this category?")) {
    return;
  }

  try {
    await del(`/api/admin/categories/${id}`);

    setCategories((prev) =>
      prev.filter((item) => item.id !== id)
    );
  } catch (error) {
    console.error("Failed to delete category:", error);
    alert(error.message || "Failed to delete category.");
  }
};

  const handleSubmit = async (e) => {
  e.preventDefault();


  try {
    if (editingCategory) {
      // UPDATE existing category
      const updatedCategory = await put(
        `/api/admin/categories/${editingCategory.id}`,
        {
          name: formData.name,
          description: formData.description,
        }
      );

      setCategories((prev) =>
        prev.map((category) =>
          category.id === editingCategory.id
            ? updatedCategory
            : category
        )
      );
    } else {
 const newCategory = await post("/api/admin/categories", {
  name: formData.name,
  slug: formData.name.trim().toLowerCase().replace(/\s+/g, "-"),
});

  setCategories((prev) => [...prev, newCategory]);
}
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
  } catch (error) {
    console.error("Category operation failed:", error);
    alert(error.message || "Failed to save category.");
  }
};
  return (
    <main className="min-h-screen bg-[#F8F6F2] text-[#1D1D1B]">
      {/* Desktop Header */}
      <header className="border-b border-[#E5E0D8] bg-white px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Categories</h1>
            <p className="mt-1 text-sm text-[#77736D]">
              Organize products into collections and departments
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A85838] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8f4a2e]"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </header>

      <div className="p-5 sm:p-6 lg:p-8">
        {/* Search Bar */}
        <div className="mb-6 max-w-md relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#99948C]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#E8E2D9] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#C9A227]"
          />
        </div>

        {/* Categories Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white shadow-sm">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle size={40} className="text-[#99948C] mb-3" />
              <h3 className="text-base font-semibold">No categories found</h3>
              <p className="mt-1 text-sm text-[#77736D]">
                Try adjusting your search query or create a new category.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF8F3] text-xs uppercase tracking-wide text-[#77736D] border-b border-[#EEE9E2]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Category Name</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Linked Products</th>
                    <th className="px-6 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE6]">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#FAF8F3]/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2E7C2] text-[#A85838]">
                            <Tags size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-[#1D1D1B]">{cat.name}</p>
                            <p className="text-xs text-[#99948C]">ID: {cat.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-[#55514B]">
                        {cat.description || "—"}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {cat.productCount} items
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="rounded-lg p-2 text-[#77736D] hover:bg-[#F2E7C2] hover:text-[#A85838] transition"
                            title="Edit Category"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="rounded-lg p-2 text-[#77736D] hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete Category"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#E8E2D9]">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEE9E2]">
              <h2 className="text-lg font-semibold">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#99948C] hover:text-[#1D1D1B]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#55514B] mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E8E2D9] px-3.5 py-2 text-sm outline-none focus:border-[#C9A227]"
                  placeholder="e.g. Handmade Pottery"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#55514B] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E8E2D9] px-3.5 py-2 text-sm outline-none focus:border-[#C9A227]"
                  placeholder="Brief description of the collection..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EEE9E2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#E8E2D9] px-4 py-2 text-sm font-medium text-[#77736D] hover:bg-[#FAF8F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#A85838] px-5 py-2 text-sm font-medium text-white hover:bg-[#8f4a2e]"
                >
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}