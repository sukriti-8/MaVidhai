"use client";

import { useEffect, useMemo, useState } from "react";
import { get, patch } from "@/lib/api";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  X,
  Calendar,
  User,
  CreditCard,
  Package,
} from "lucide-react";

/*
 * PREVIEW DATA ONLY
 *
 * These orders are for the founder/UI demonstration.
 * They are NOT stored in the database.
 *
 * Later:
 * GET /api/admin/orders
 * will provide the real order data.
 */

const INITIAL_ORDERS = [
  {
    id: "ORD-P001",
    customer: "Preview Customer 01",
    email: "customer01@example.com",
    items: [
      {
        name: "Handwoven Cotton Saree – Pink & Deep Purple",
        qty: 1,
        price: 999,
      },
    ],
    total: 999,
    status: "Processing",
    paymentMethod: "Preview Payment",
    date: "2026-09-23",
    address: "Preview Address",
  },
  {
    id: "ORD-P002",
    customer: "Preview Customer 02",
    email: "customer02@example.com",
    items: [
      {
        name: "Lion Face Rope Storage Basket with Lid – Green",
        qty: 1,
        price: 299,
      },
    ],
    total: 299,
    status: "Delivered",
    paymentMethod: "Preview Payment",
    date: "2026-09-22",
    address: "Preview Address",
  },
  {
    id: "ORD-P003",
    customer: "Preview Customer 03",
    email: "customer03@example.com",
    items: [
      {
        name: "Handwoven Cotton Saree – Pink & Deep Purple",
        qty: 1,
        price: 999,
      },
      {
        name: "Lion Face Rope Storage Basket with Lid – Green",
        qty: 1,
        price: 299,
      },
    ],
    total: 1298,
    status: "Shipped",
    paymentMethod: "Preview Payment",
    date: "2026-09-21",
    address: "Preview Address",
  },
];

const STATUS_OPTIONS = [
  "All",
  "Processing",
  "Shipped",
  "Delivered",
];

function getStatusBadge(status) {
  switch (status) {
    case "Delivered":
      return {
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700",
      };

    case "Shipped":
      return {
        icon: Truck,
        className: "bg-blue-50 text-blue-700",
      };

    case "Processing":
      return {
        icon: Clock,
        className: "bg-amber-50 text-amber-700",
      };

    default:
      return {
        icon: XCircle,
        className: "bg-stone-100 text-stone-600",
      };
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedOrder, setSelectedOrder] = useState(null);
  useEffect(() => {
  const loadOrders = async () => {
    try {
      const data = await get("/api/admin/orders");
      if (data?.items && data.items.length > 0) {
  setOrders(data.items);
}
    } catch (error) {
      console.error("Failed to load orders:", error);
    }
  };

  loadOrders();
}, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const search = searchQuery.toLowerCase();

      const matchesSearch =
        order.id.toLowerCase().includes(search) ||
        order.customer.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  /*
   * PREVIEW ONLY
   *
   * Later this function will call:
   *
   * PATCH /api/admin/orders/{id}/status
   */
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
  await patch(`/api/admin/orders/${orderId}/status`, {
    status: newStatus,
  });
} catch (error) {
  console.error("Failed to update order status:", error);
  alert(error.message || "Failed to update order status.");
  return;
}
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus,
            }
          : order
      )
    );

    setSelectedOrder((current) =>
      current?.id === orderId
        ? {
            ...current,
            status: newStatus,
          }
        : current
    );
  };

  return (
    <div className="space-y-6">

      {/* ================= PAGE HEADER ================= */}

      <div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A85838]">
          Sales
        </p>

        <h1 className="text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
          Order Management
        </h1>

        <p className="mt-1 text-sm text-stone-500">
          Track customer purchases and fulfillment status.
        </p>

      </div>

      {/* ================= SEARCH / FILTER ================= */}

      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8DFC8] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div className="relative w-full max-w-md">

          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search by Order ID or customer..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-[#B8860B] focus:bg-white"
          />

        </div>

        <div className="flex items-center gap-2">

          <Filter
            size={16}
            className="text-stone-400"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 outline-none focus:border-[#B8860B]"
          >
            {STATUS_OPTIONS.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status === "All"
                  ? "All Statuses"
                  : status}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* ================= COUNT ================= */}

      <div className="text-sm text-[#77736D]">

        Showing{" "}
        <span className="font-semibold text-[#1D1D1B]">
          {filteredOrders.length}
        </span>{" "}
        order
        {filteredOrders.length !== 1 ? "s" : ""}

      </div>

      {/* ================= ORDERS TABLE ================= */}

      <div className="overflow-hidden rounded-2xl border border-[#E8DFC8] bg-white shadow-sm">

        {filteredOrders.length === 0 ? (

          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

            <Package
              size={40}
              className="text-stone-300"
            />

            <h3 className="mt-4 font-semibold text-stone-700">
              No matching orders found
            </h3>

            <p className="mt-1 text-sm text-stone-400">
              Try changing your search or status filter.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead className="border-b border-stone-100 bg-[#FDFBF7]">

                <tr>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                    Order ID
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                    Date
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                    Total
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                    Payment
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-stone-400">
                    Details
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-stone-100">

                {filteredOrders.map((order) => {

                  const status = getStatusBadge(
                    order.status
                  );

                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-amber-50/30"
                    >

                      {/* Order ID */}
                      <td className="px-6 py-5">

                        <p className="font-bold text-stone-900">
                          {order.id}
                        </p>

                      </td>

                      {/* Customer */}
                      <td className="px-6 py-5">

                        <p className="font-semibold text-stone-900">
                          {order.customer}
                        </p>

                        <p className="mt-1 text-xs text-stone-400">
                          {order.email}
                        </p>

                      </td>

                      {/* Date */}
                      <td className="px-6 py-5 text-sm text-stone-500">
                        {order.date}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-5">

                        <p className="font-bold text-stone-900">
                          ₹
                          {order.total.toLocaleString(
                            "en-IN"
                          )}
                        </p>

                      </td>

                      {/* Payment */}
                      <td className="px-6 py-5 text-sm text-stone-600">
                        {order.paymentMethod}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                        >
                          <StatusIcon size={13} />
                          {order.status}
                        </span>

                      </td>

                      {/* Details */}
                      <td className="px-6 py-5 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(order)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-1.5 text-xs font-semibold text-[#B8860B] transition hover:bg-amber-100"
                        >
                          <Eye size={14} />
                          View
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

      {/* ================= PREVIEW NOTICE ================= */}

      <div className="rounded-xl border border-[#E8DFC8] bg-[#FFFDF8] px-4 py-3">

        <p className="text-xs leading-5 text-stone-500">

          <span className="font-semibold text-stone-700">
            Preview mode:
          </span>{" "}
          Orders shown here are sample UI data. Status
          changes are currently local and will later connect
          to the admin order API.

        </p>

      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}

      {selectedOrder && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E8DFC8] bg-white p-6 shadow-2xl">

            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between border-b border-stone-100 pb-4">

              <div>

                <h2 className="text-lg font-bold text-stone-900">
                  Order Details
                </h2>

                <p className="mt-1 flex items-center gap-1 text-xs text-stone-400">
                  <Calendar size={12} />
                  {selectedOrder.id} · {selectedOrder.date}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close order details"
              >
                <X size={19} />
              </button>

            </div>

            <div className="space-y-6">

              {/* Customer */}
              <div className="rounded-xl border border-[#E8DFC8] bg-[#FDFBF7] p-4">

                <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
                  <User size={14} />
                  Customer
                </p>

                <p className="font-semibold text-stone-900">
                  {selectedOrder.customer}
                </p>

                <p className="mt-1 text-sm text-stone-500">
                  {selectedOrder.email}
                </p>

              </div>

              {/* Shipping & Payment */}
              <div className="rounded-xl border border-[#E8DFC8] bg-[#FDFBF7] p-4">

                <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
                  <CreditCard size={14} />
                  Shipping & Payment
                </p>

                <p className="text-sm text-stone-700">
                  {selectedOrder.address}
                </p>

                <p className="mt-2 text-sm text-stone-500">
                  Payment:{" "}
                  <span className="font-medium text-stone-700">
                    {selectedOrder.paymentMethod}
                  </span>
                </p>

              </div>

              {/* Items */}
              <div>

                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Purchased Items
                </p>

                <div className="rounded-xl border border-stone-200 bg-stone-50/50">

                  {selectedOrder.items.map(
                    (item, index) => (
                      <div
                        key={`${selectedOrder.id}-${index}`}
                        className="flex items-center justify-between border-b border-stone-200 px-4 py-4 last:border-0"
                      >

                        <div>

                          <p className="font-semibold text-stone-900">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-stone-400">
                            Quantity: {item.qty}
                          </p>

                        </div>

                        <p className="font-bold text-stone-900">
                          ₹
                          {(
                            item.price * item.qty
                          ).toLocaleString("en-IN")}
                        </p>

                      </div>
                    )
                  )}

                  <div className="flex items-center justify-between border-t border-stone-200 px-4 py-4">

                    <span className="font-bold text-stone-900">
                      Total
                    </span>

                    <span className="text-lg font-bold text-[#B8860B]">
                      ₹
                      {selectedOrder.total.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* Status */}
              <div>

                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Update Fulfillment Status
                </label>

                <div className="grid grid-cols-3 gap-2">

                  {[
                    "Processing",
                    "Shipped",
                    "Delivered",
                  ].map((status) => (

                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        updateOrderStatus(
                          selectedOrder.id,
                          status
                        )
                      }
                      className={`rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                        selectedOrder.status === status
                          ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white shadow-sm"
                          : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {status}
                    </button>

                  ))}

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}