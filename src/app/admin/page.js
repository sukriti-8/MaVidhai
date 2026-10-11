"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import {
  Package,
  Boxes,
  ClipboardList,
  TrendingUp,
  Plus,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("mavidhai_user") || "null");
      if (currentUser?.role === "SUB_ADMIN") {
        router.replace("/admin/products");
        return;
      }
    } catch {
      // Continue to the dashboard; the API will report authentication issues inline.
    }

    const loadDashboard = async () => {
      try {
        // Dashboard data
        const data = await get("/api/admin/dashboard");

        // Product count
        const productsData = await get(
          "/api/admin/products?page=1&limit=1"
        );

        // Inventory data
        const inventoryData = await get("/api/admin/inventory");

        // Store dashboard data
        setDashboardData(data);

        // Store total product count
        setProductCount(productsData?.total ?? 0);

        // Store only low-stock products
        const inventoryItems = Array.isArray(inventoryData)
          ? inventoryData
          : inventoryData?.items ?? [];

        setLowStock(
          inventoryItems.filter((item) => item?.is_low_stock === true)
        );
      } catch (error) {
        setDashboardError(error.message || "Unable to load the dashboard.");
      }
    };

    loadDashboard();
  }, [router]);

  const stats = [
    {
      label: "TOTAL PRODUCTS",
      value: productCount,
      icon: Package,
      href: "/admin/products",
      trend: "",
    },
    {
      label: "TOTAL ORDERS",
      value: dashboardData?.metrics?.total_orders ?? 0,
      icon: ClipboardList,
      href: "/admin/orders",
      trend: "",
    },
    {
      label: "LOW STOCK ITEMS",
      value: dashboardData?.inventory_summary?.low_stock_count ?? 0,
      icon: Boxes,
      href: "/admin/inventory",
      trend:
        (dashboardData?.inventory_summary?.low_stock_count ?? 0) > 0
          ? "Requires attention"
          : "All stock levels healthy",
      alert:
        (dashboardData?.inventory_summary?.low_stock_count ?? 0) > 0,
    },
    {
      label: "GROSS REVENUE",
      value: `₹${dashboardData?.metrics?.total_revenue ?? 0}`,
      icon: TrendingUp,
      href: "/admin/orders",
      trend: "",
    },
  ];

  const recentOrders = (dashboardData?.recent_orders ?? []).map((order) => ({
    ...order,
    displayId: order.order_number || order.id,
    displayTotal: Number(order.total_amount ?? 0),
    displayStatus: ({
      pending: "Pending",
      confirmed: "Processing",
      inventory_conflict: "Inventory Issue",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    })[order.order_status] || order.order_status || "Pending",
    displayDate: order.created_at
      ? new Date(order.created_at).toLocaleDateString()
      : "—",
  }));

  return (
    <div className="space-y-8">
      {dashboardError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {dashboardError}
        </p>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
            Store Overview
          </h1>

          <p className="mt-1 text-xs text-stone-500">
            Real-time analytics and management controls for your artisan
            catalog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:brightness-105 transition-all"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.label}
              href={card.href}
              className="group block rounded-2xl border border-[#EBE3D0] bg-white p-6 shadow-sm transition-all hover:border-[#B8860B] hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-stone-400">
                  {card.label}
                </span>

                <span
                  className={`rounded-xl p-2.5 ${
                    card.alert
                      ? "bg-amber-100 text-amber-700"
                      : "bg-amber-50 text-[#B8860B] border border-amber-100"
                  }`}
                >
                  <Icon size={20} />
                </span>
              </div>

              <p className="mt-4 text-3xl font-black text-stone-900">
                {card.value}
              </p>

              {card.trend && (
                <div className="mt-3 flex items-center justify-between text-xs font-medium">
                  <span
                    className={
                      card.alert
                        ? "text-amber-700 font-semibold"
                        : "text-stone-500"
                    }
                  >
                    {card.trend}
                  </span>

                  <ArrowUpRight
                    size={14}
                    className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#B8860B]"
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl border border-[#EBE3D0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Recent Orders
              </h2>

              <p className="text-xs text-stone-500">
                Latest customer checkouts
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#B8860B] hover:underline"
            >
              View All Orders &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-stone-500"
                    >
                      No recent orders
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order.order_number || order.id}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <td className="py-3.5 font-bold text-stone-900">
                        {order.displayId}
                      </td>

                      <td className="py-3.5 text-stone-700">
                        {order.customer}
                      </td>

                      <td className="py-3.5 font-semibold text-stone-900">
                        ₹{order.displayTotal.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            order.displayStatus === "Delivered"
                              ? "bg-emerald-50 text-emerald-700"
                              : order.displayStatus === "Shipped"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {order.displayStatus}
                        </span>
                      </td>

                      <td className="py-3.5 text-right text-stone-400">
                        {order.displayDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-[#EBE3D0] bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                size={17}
                className="text-[#B8860B]"
              />

              <h2 className="text-base font-bold text-stone-900">
                Low Stock Warning
              </h2>
            </div>

            <p className="text-xs text-stone-500 mb-5">
              Items nearing stockout threshold
            </p>

            <div className="space-y-4">
              {lowStock.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-500">
                  No low-stock products
                </p>
              ) : (
                lowStock.map((item) => (
                  <div
                    key={item.id ?? item.name}
                    className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3.5"
                  >
                    <p className="text-xs font-bold text-stone-800 line-clamp-1">
                      {item.name}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                      <span>
                        Remaining:{" "}
                        <strong className="text-[#B8860B]">
                          {item.stock}
                        </strong>
                      </span>

                      <span>
                        Min: {item.threshold ?? "-"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/admin/inventory"
            className="mt-6 block text-center rounded-xl border border-amber-200 bg-amber-50/40 py-2.5 text-xs font-semibold text-[#B8860B] hover:bg-amber-100/50 transition-colors"
          >
            Manage Inventory &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
