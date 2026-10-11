"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  getCart,
  createOrder,
  setAuthToken,
  getOrder,
  createPayment,
} from "@/lib/api";

const colors = {
  ivory: "#F8F6F2",
  white: "#FFFFFF",
  peach: "#F2C9B9",
  terracotta: "#A85838",
  sage: "#A8B39F",
  forest: "#3F5144",
  charcoal: "#1D1D1B",
  muted: "#6F6A63",
  border: "#D9DED4",
  soft: "#F1EDE7",
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    shipping_full_name: "",
    shipping_email: "",
    shipping_phone: "",
    shipping_address_line1: "",
    shipping_address_line2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "India",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      try {
        const data = await getCart();

        if (cancelled) return;

        if (!data || !data.items || data.items.length === 0) {
          router.replace("/cart");
          return;
        }

        setCart(data);
      } catch (err) {
        if (cancelled) return;

        if (err.message === "Unauthorized") {
          setAuthToken(null);
          router.push("/login");
        } else {
          console.error("Failed to load checkout:", err);
          setInitError("Failed to load checkout details. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Poll for order/payment confirmation.
  useEffect(() => {
    if (!createdOrder?.order_number || isSuccess) return;

    let cancelled = false;
    let intervalId;

    const checkOrder = async () => {
      try {
        const data = await getOrder(createdOrder.order_number);

        if (cancelled || !data) return;

        if (
          data.status === "confirmed" ||
          data.status === "inventory_conflict" ||
          data.payment_status === "captured"
        ) {
          setCreatedOrder(data);
          setIsSuccess(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Order confirmation polling error:", err);
        }
      }
    };

    intervalId = setInterval(checkOrder, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [createdOrder?.order_number, isSuccess]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setInitError(null);
    setSubmitting(true);

    try {
      // 1. Create the order.
      const order = await createOrder(formData);

      if (!order?.order_number) {
        throw new Error("The order was created without an order number.");
      }

      setCreatedOrder(order);

      // 2. Create the payment link.
      const payment = await createPayment(order.order_number);

      setPaymentData(payment);
    } catch (err) {
      console.error("Checkout initialization failed:", err);

      if (err.message === "Unauthorized") {
        setAuthToken(null);
        router.push("/login");
      } else {
        setInitError(
          err.message || "Failed to initialize checkout. Please try again."
        );
      }

      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: colors.ivory }}
      >
        <p style={{ color: colors.forest }}>Preparing checkout...</p>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: colors.ivory }}
      >
        <div
          className="w-full max-w-md rounded-2xl border p-8 shadow-sm"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.sage,
          }}
        >
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={{
              backgroundColor: "#E6F0E7",
              color: colors.forest,
            }}
          >
            ✓
          </div>

          <h1
            className="mb-4 text-2xl font-bold"
            style={{
              color: colors.charcoal,
              fontFamily: "Georgia, serif",
            }}
          >
            {createdOrder?.status === "inventory_conflict"
              ? "Order Update"
              : "Order Confirmed!"}
          </h1>

          <p
            className="mb-8 leading-relaxed"
            style={{ color: colors.forest }}
          >
            {createdOrder?.status === "inventory_conflict"
              ? `Order #${createdOrder?.order_number} needs attention because of a stock availability issue. Please check your order details.`
              : `Your payment was successful and your order #${createdOrder?.order_number} has been placed.`}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={
                createdOrder?.order_number
                  ? `/orders/${createdOrder.order_number}`
                  : "/orders"
              }
              className="flex-1 rounded-lg py-3 text-center text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: colors.terracotta }}
            >
              View Order
            </Link>

            <Link
              href="/shop"
              className="flex-1 rounded-lg border py-3 text-center text-sm font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: colors.terracotta,
                color: colors.terracotta,
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (paymentData) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: colors.ivory }}
      >
        <div
          className="w-full max-w-md rounded-2xl border p-8 shadow-sm"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.sage,
          }}
        >
          <h1
            className="mb-4 text-2xl font-bold"
            style={{
              color: colors.charcoal,
              fontFamily: "Georgia, serif",
            }}
          >
            Complete Payment
          </h1>

          <p
            className="mb-6 leading-relaxed"
            style={{ color: colors.forest }}
          >
            We have prepared your payment link. You can pay using the
            available options below. This page will check for payment
            confirmation automatically.
          </p>

          <div className="flex flex-col gap-4">
            {paymentData.whatsapp_deep_link && (
              <a
                href={paymentData.whatsapp_deep_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                Pay via WhatsApp
              </a>
            )}

            {paymentData.payment_url && (
              <a
                href={paymentData.payment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: colors.terracotta }}
              >
                Open Payment Link
              </a>
            )}

            {!paymentData.whatsapp_deep_link &&
              !paymentData.payment_url && (
                <p
                  className="rounded-lg p-3 text-sm"
                  style={{
                    backgroundColor: colors.soft,
                    color: colors.muted,
                  }}
                >
                  No payment link is currently available. Please contact
                  support before retrying payment.
                </p>
              )}
          </div>

          <div
            className="mt-8 flex items-center justify-center gap-2 text-sm"
            style={{ color: colors.forest }}
          >
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: colors.terracotta }}
            />
            Waiting for confirmation...
          </div>

          <p className="mt-4 text-xs" style={{ color: colors.muted }}>
            Please avoid creating another order while this payment is pending.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-6 py-10 lg:px-10 lg:py-16"
      style={{
        backgroundColor: colors.ivory,
        color: colors.charcoal,
      }}
    >
      <div className="mx-auto max-w-[1200px]">
        <h1
          className="text-3xl font-bold sm:text-4xl"
          style={{
            color: colors.charcoal,
            fontFamily: "Georgia, serif",
          }}
        >
          Checkout
        </h1>

        {initError && (
          <div
            role="alert"
            className="mt-6 rounded-lg border p-4"
            style={{
              borderColor: colors.peach,
              backgroundColor: colors.white,
              color: colors.terracotta,
            }}
          >
            {initError}
          </div>
        )}

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
          {/* SHIPPING FORM */}
          <div
            className="rounded-2xl border p-6 sm:p-8"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.sage,
            }}
          >
            <h2
              className="mb-6 text-xl font-semibold"
              style={{ color: colors.charcoal }}
            >
              Shipping Address
            </h2>

            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2"
            >
              {[
                {
                  name: "shipping_full_name",
                  label: "Full Name",
                  type: "text",
                  required: true,
                  wide: true,
                },
                {
                  name: "shipping_email",
                  label: "Email",
                  type: "email",
                  required: true,
                },
                {
                  name: "shipping_phone",
                  label: "Phone",
                  type: "tel",
                  required: true,
                },
                {
                  name: "shipping_address_line1",
                  label: "Address Line 1",
                  type: "text",
                  required: true,
                  wide: true,
                },
                {
                  name: "shipping_address_line2",
                  label: "Address Line 2 (Optional)",
                  type: "text",
                  required: false,
                  wide: true,
                },
                {
                  name: "shipping_city",
                  label: "City",
                  type: "text",
                  required: true,
                },
                {
                  name: "shipping_state",
                  label: "State",
                  type: "text",
                  required: true,
                },
                {
                  name: "shipping_postal_code",
                  label: "Postal Code",
                  type: "text",
                  required: true,
                },
              ].map((field) => (
                <div
                  key={field.name}
                  className={field.wide ? "sm:col-span-2" : ""}
                >
                  <label
                    htmlFor={field.name}
                    className="block text-sm font-medium"
                    style={{ color: colors.forest }}
                  >
                    {field.label}
                  </label>

                  <input
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    required={field.required}
                    autoComplete={
                      field.name === "shipping_full_name"
                        ? "name"
                        : field.name === "shipping_email"
                          ? "email"
                          : field.name === "shipping_phone"
                            ? "tel"
                            : field.name === "shipping_address_line1"
                              ? "address-line1"
                              : field.name === "shipping_address_line2"
                                ? "address-line2"
                                : field.name === "shipping_city"
                                  ? "address-level2"
                                  : field.name === "shipping_state"
                                    ? "address-level1"
                                    : "postal-code"
                    }
                    value={formData[field.name]}
                    onChange={handleChange}
                    disabled={submitting}
                    className="mt-1 block w-full rounded-lg border px-4 py-3 outline-none transition-colors focus:border-[#A85838] disabled:opacity-50"
                    style={{
                      borderColor: colors.sage,
                      color: colors.charcoal,
                      backgroundColor: colors.white,
                    }}
                  />
                </div>
              ))}

              <div>
                <label
                  htmlFor="shipping_country"
                  className="block text-sm font-medium"
                  style={{ color: colors.forest }}
                >
                  Country
                </label>

                <input
                  id="shipping_country"
                  type="text"
                  name="shipping_country"
                  required
                  readOnly
                  value={formData.shipping_country}
                  className="mt-1 block w-full rounded-lg border px-4 py-3 outline-none"
                  style={{
                    borderColor: colors.sage,
                    backgroundColor: colors.ivory,
                    color: colors.forest,
                  }}
                />
              </div>
            </form>
          </div>

          {/* ORDER SUMMARY */}
          <div
            className="h-fit rounded-2xl border p-6 sm:p-8 lg:sticky lg:top-8"
            style={{
              borderColor: colors.sage,
              backgroundColor: colors.white,
            }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: colors.charcoal }}
            >
              Order Summary
            </h2>

            <div
              className="mt-6 flex flex-col gap-4 border-b pb-6"
              style={{ borderColor: colors.sage }}
            >
              {cart?.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span
                    className="mr-2 truncate"
                    style={{ color: colors.forest }}
                  >
                    {item.quantity} × {item.product.name}
                  </span>

                  <span
                    className="shrink-0 font-medium"
                    style={{ color: colors.charcoal }}
                  >
                    ₹
                    {Number(item.subtotal).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-6 flex items-center justify-between border-b pb-6"
              style={{ borderColor: colors.sage }}
            >
              <span style={{ color: colors.forest }}>Subtotal</span>

              <span
                className="font-semibold"
                style={{ color: colors.charcoal }}
              >
                ₹
                {Number(cart?.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span
                className="font-semibold"
                style={{ color: colors.charcoal }}
              >
                Total
              </span>

              <span
                className="text-xl font-bold"
                style={{ color: colors.terracotta }}
              >
                ₹
                {Number(cart?.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="mt-8 w-full rounded-lg py-4 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: colors.forest }}
            >
              {submitting
                ? "Processing..."
                : `Checkout ₹${Number(
                    cart?.subtotal || 0
                  ).toLocaleString("en-IN")}`}
            </button>

            <p
              className="mt-3 text-center text-xs"
              style={{ color: colors.muted }}
            >
              Shipping and taxes are calculated at checkout.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}