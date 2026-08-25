import Link from "next/link";
import OrderStatus from "@/components/OrderStatus/OrderStatus";

export default function OrderCard({ order }) {
  const date = new Date(order.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl border border-[#eadfca] p-6 shadow-sm mb-4">
      <div className="flex flex-col gap-2 mb-4 sm:mb-0">
        <div className="text-sm font-medium text-[#756d63]">{order.order_number}</div>
        <div className="text-lg font-bold text-[#29251f]">₹{Number(order.total_amount).toLocaleString("en-IN")}</div>
        <div className="text-sm text-[#756d63]">{date} • {order.items_count || (order.items && order.items.length) || 0} items</div>
        <div className="mt-1">
          <OrderStatus status={order.status} />
        </div>
      </div>
      <div className="sm:text-right flex items-center sm:block">
        <Link 
          href={`/orders/${order.order_number}`}
          className="text-[#d1a11c] font-medium hover:text-[#bd8d0f] transition-colors"
        >
          View Order &rarr;
        </Link>
      </div>
    </div>
  );
}
