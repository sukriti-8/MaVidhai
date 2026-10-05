"use client";

import { useEffect, useState } from "react";

import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  X,
  Package,
  ArrowUpDown,
} from "lucide-react";
import { get, patch } from "@/lib/api";

const INITIAL_INVENTORY = [
  {
    id: "prod_1",
    name: "Handwoven Cotton Saree",
    sku: "MV-CLOTH-001",
    category: "Clothing",
    currentStock: 18,
    minThreshold: 5,
    lastUpdated: "2026-03-28",
  },
  {
    id: "prod_2",
    name: "Lion Face Rope Basket",
    sku: "MV-HOME-002",
    category: "Home & Living",
    currentStock: 3,
    minThreshold: 5,
    lastUpdated: "2026-03-29",
  },
];

export default function AdminInventoryPage() {
 const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  useEffect(() => {
  const loadInventory = async () => {
    try {
      const data = await get("/api/admin/inventory");
      console.log("INVENTORY API DATA:", data);
      setInventory(
  (Array.isArray(data) ? data : data.items || []).map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.slug,
    category: `Category ${item.category_id}`,
    currentStock: item.stock,
    minThreshold: 5,
    lastUpdated: "-",
  }))
);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  };

  loadInventory();
}, []);

  // Quick Edit Stock Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(0);

  const getStockStatus = (item) => {
    if (item.currentStock === 0) {
      return { label: "Out of Stock", color: "bg-red-50 text-red-700", icon: XCircle };
    }
    if (item.currentStock <= item.minThreshold) {
      return { label: "Low Stock", color: "bg-amber-50 text-amber-700", icon: AlertTriangle };
    }
    return { label: "In Stock", color: "bg-green-50 text-green-700", icon: CheckCircle2 };
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const status = getStockStatus(item).label;
    const matchesStatus = filterStatus === "All" || status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAdjustModal = (item) => {
    setSelectedItem(item);
    setAdjustAmount(0);
    setIsModalOpen(true);
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
  await patch("/api/admin/inventory/bulk-adjust", {
    items: [
      {
        product_id: selectedItem.id,
        delta: Number(adjustAmount),
        reason: "Manual stock adjustment",
      },
    ],
  });
} catch (error) {
  console.error("Failed to update stock:", error);
  alert(error.message || "Failed to update stock.");
  return;
}

    setInventory((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              currentStock: Math.max(0, item.currentStock + Number(adjustAmount)),
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : item
      )
    );
    setIsModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#F8F6F2] text-[#1D1D1B]">
      {/* Header */}
      <header className="border-b border-[#E5E0D8] bg-white px-6 py-5 sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold">Inventory Management</h1>
          <p className="mt-1 text-sm text-[#77736D]">
            Monitor item quantities, thresholds, and restock levels
          </p>
        </div>
      </header>

      <div className="p-5 sm:p-6 lg:p-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#99948C]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E8E2D9] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#C9A227]"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {["All", "In Stock", "Low Stock", "Out of Stock"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                  filterStatus === status
                    ? "bg-[#C9A227] text-white"
                    : "bg-white text-[#77736D] border border-[#E8E2D9] hover:bg-[#FAF8F3]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white shadow-sm">
          {filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertTriangle size={40} className="text-[#99948C] mb-3" />
              <h3 className="text-base font-semibold">No inventory records found</h3>
              <p className="mt-1 text-sm text-[#77736D]">
                Adjust your search or filter settings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF8F3] text-xs uppercase tracking-wide text-[#77736D] border-b border-[#EEE9E2]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Item / SKU</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Available Units</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Last Modified</th>
                    <th className="px-6 py-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE6]">
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item);
                    const StatusIcon = status.icon;

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF8F3]/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-[#1D1D1B]">{item.name}</p>
                            <p className="text-xs text-[#99948C]">SKU: {item.sku}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-[#55514B]">{item.category}</td>

                        <td className="px-6 py-4">
                          <span className="font-semibold">{item.currentStock}</span>
                          <span className="text-xs text-[#99948C]"> (min: {item.minThreshold})</span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
                          >
                            <StatusIcon size={13} /> {status.label}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-[#77736D]">
                          {item.lastUpdated}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E2D9] px-3 py-1.5 text-xs font-medium text-[#55514B] hover:border-[#C9A227] hover:bg-[#FAF8F3] transition"
                          >
                            <ArrowUpDown size={14} /> Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#E8E2D9]">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEE9E2]">
              <h2 className="text-lg font-semibold">Adjust Stock Level</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#99948C] hover:text-[#1D1D1B]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStockUpdate} className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium">{selectedItem.name}</p>
                <p className="text-xs text-[#99948C]">
                  Current count: <span className="font-semibold text-[#1D1D1B]">{selectedItem.currentStock}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#55514B] mb-1">
                  Quantity Adjustment (positive to add, negative to deduct)
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E2D9] px-3.5 py-2 text-sm outline-none focus:border-[#C9A227]"
                  placeholder="e.g. 5 or -2"
                />
              </div>

              <p className="text-xs text-[#77736D]">
                New stock total will be:{" "}
                <strong>{Math.max(0, selectedItem.currentStock + Number(adjustAmount || 0))}</strong>
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EEE9E2]">
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
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}