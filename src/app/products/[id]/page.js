"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const products = [
  {
    id: 1,
    name: "Pink Floral Cotton Saree",
    price: 1499,
    image: "/sarees/saree-1.png",
    category: "Cotton Sarees",
    description:
      "A vibrant pink cotton saree featuring beautiful floral prints, delicate tassel detailing, and a subtle golden border. A stylish and comfortable choice for festive and casual occasions.",
    variants: ["Free Size"],
  },
  {
    id: 2,
    name: "Olive Green Lotus Saree",
    price: 1699,
    image: "/sarees/saree-2.png",
    category: "Handloom Sarees",
    description:
      "A beautiful olive green saree featuring traditional lotus motifs with a contrasting white floral border and elegant tassel detailing. Perfect for a graceful ethnic look.",
    variants: ["Free Size"],
  },
  {
    id: 3,
    name: "White Bird Print Saree",
    price: 1599,
    image: "/sarees/saree-3.png",
    category: "Cotton Sarees",
    description:
      "An elegant white saree featuring artistic bird prints, black tassel detailing, and a traditional contrasting border. A simple and sophisticated choice for everyday and special occasions.",
    variants: ["Free Size"],
  },
  {
    id: 4,
    name: "Parrot Green Cotton Saree",
    price: 1499,
    image: "/sarees/saree-4.png",
    category: "Cotton Sarees",
    description:
      "A vibrant parrot green cotton saree featuring colorful parrot motifs and a traditional golden border. A comfortable and eye-catching choice for everyday wear and casual occasions.",
    variants: ["Free Size"],
  },
  {
    id: 5,
    name: "Mustard Floral Saree",
    price: 1599,
    image: "/sarees/saree-5.png",
    category: "Handloom Sarees",
    description:
      "A warm mustard saree featuring traditional floral motifs, a contrasting border, and matching tassel detailing. An elegant addition to a traditional wardrobe.",
    variants: ["Free Size"],
  },
];

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = Number(params.id);

  const product = products.find((item) => item.id === productId);

  const [selectedSize, setSelectedSize] = useState(
    product?.variants?.[0] || "Free Size"
  );

  const [quantity, setQuantity] = useState(1);

  const increaseQuantity = () => {
    setQuantity((current) => current + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const handleAddToCart = () => {
    if (!product) return;

    console.log({
      productId: product.id,
      productName: product.name,
      size: selectedSize,
      quantity,
    });

    alert(`${product.name} added to cart!`);
  };

  if (!product) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-lg">
          <h1 className="text-3xl font-bold text-[#2B2B2B]">
            Product Not Found
          </h1>

          <p className="mt-4 text-gray-600">
            Sorry, the product you are looking for does not exist.
          </p>

          <Link
            href="/shop"
            className="mt-6 inline-block rounded-lg bg-[#C9A227] px-6 py-3 font-semibold text-white transition hover:bg-[#B8860B]"
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F3] px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-gray-500">
          <Link
            href="/"
            className="transition hover:text-[#C9A227]"
          >
            Home
          </Link>

          {" / "}

          <Link
            href="/shop"
            className="transition hover:text-[#C9A227]"
          >
            Shop
          </Link>

          {" / "}

          <span className="text-gray-700">
            {product.name}
          </span>
        </div>

        {/* Product Details */}
        <div className="grid gap-10 rounded-2xl bg-white p-6 shadow-lg md:grid-cols-2 md:p-10">

          {/* Product Image */}
          <div className="flex min-h-[400px] items-center justify-center rounded-xl bg-gray-50 p-6">
            <img
              src={product.image}
              alt={product.name}
              className="h-auto max-h-[550px] w-full rounded-xl object-contain"
            />
          </div>

          {/* Product Information */}
          <div className="flex flex-col">

            {/* Category */}
            <p className="text-sm font-medium uppercase tracking-wide text-[#C9A227]">
              {product.category}
            </p>

            {/* Product Name */}
            <h1 className="mt-3 text-3xl font-bold text-[#2B2B2B] md:text-4xl">
              {product.name}
            </h1>

            {/* Price */}
            <p className="mt-5 text-2xl font-bold text-[#C9A227]">
              ₹{product.price.toLocaleString("en-IN")}
            </p>

            {/* Description */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-[#2B2B2B]">
                Description
              </h2>

              <p className="mt-2 leading-7 text-gray-600">
                {product.description}
              </p>
            </div>

            {/* Size */}
            <div className="mt-7">
              <h2 className="text-lg font-semibold text-[#2B2B2B]">
                Select Size
              </h2>

              <div className="mt-3 flex flex-wrap gap-3">
                {product.variants.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-lg border px-5 py-2.5 font-medium transition-all ${
                      selectedSize === size
                        ? "border-[#C9A227] bg-[#C9A227] text-white"
                        : "border-gray-300 text-gray-700 hover:border-[#C9A227] hover:text-[#C9A227]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-7">
              <h2 className="text-lg font-semibold text-[#2B2B2B]">
                Quantity
              </h2>

              <div className="mt-3 flex w-fit items-center overflow-hidden rounded-lg border border-gray-300">

                <button
                  type="button"
                  onClick={decreaseQuantity}
                  className="px-4 py-2 text-xl text-gray-700 transition hover:bg-gray-100"
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <span className="min-w-12 px-4 py-2 text-center font-medium text-gray-900">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  className="px-4 py-2 text-xl text-gray-700 transition hover:bg-gray-100"
                  aria-label="Increase quantity"
                >
                  +
                </button>

              </div>
            </div>

            {/* Add to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-8 w-full rounded-lg bg-[#C9A227] py-3.5 font-semibold text-white transition-all duration-300 hover:bg-[#B8860B] hover:shadow-lg"
            >
              Add to Cart
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}