"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/lib/api";

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await getProductBySlug(slug);
        if (!data) {
          setError(404);
        } else {
          setProduct(data);
        }
      } catch (err) {
        console.error(err);
        setError(500);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffdf8] flex items-center justify-center">
        <p className="text-[#a48d69]">Loading product...</p>
      </main>
    );
  }

  if (error === 404) {
    return (
      <main className="min-h-screen bg-[#fffdf8] flex flex-col items-center justify-center gap-4">
        <p className="text-[#29251f] font-medium text-lg">Product not found</p>
        <p className="text-[#756d63] text-sm">The product you're looking for doesn't exist or may have been removed.</p>
        <Link href="/shop" className="text-[#a48d69] underline">Back to Shop</Link>
      </main>
    );
  }

  if (error === 500) {
    return (
      <main className="min-h-screen bg-[#fffdf8] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">Failed to fetch product</p>
        <button onClick={() => window.location.reload()} className="text-[#a48d69] underline">Try again</button>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-[#fffdf8]">

      {/* =====================================================
          BREADCRUMB
      ====================================================== */}

      <div className="border-b border-[#eee5d2] bg-white px-6 py-4 lg:px-10">

        <div className="mx-auto max-w-[1300px]">

          <div className="flex items-center gap-2 text-xs text-[#91887c]">

            <Link
              href="/"
              className="hover:text-[#b27d0d]"
            >
              Home
            </Link>

            <span>/</span>

            <Link
              href="/shop"
              className="hover:text-[#b27d0d]"
            >
              Shop
            </Link>

            <span>/</span>

            <span className="text-[#5f584f]">
              {product.name}
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          PRODUCT SECTION
      ====================================================== */}

      <section className="mx-auto max-w-[1300px] px-6 py-10 lg:px-10 lg:py-16">

        <div className="grid gap-12 lg:grid-cols-2">


          {/* =================================================
              PRODUCT IMAGES
          ================================================== */}

          <div className="grid gap-4 sm:grid-cols-[90px_1fr]">

            {/* THUMBNAILS */}

            <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">

              <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-[#d1a11c] bg-[#f1e8d7]">

                <span className="text-lg text-[#c99716]">
                  ✦
                </span>

              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-[#eadfca] bg-[#f1e8d7]">

                <span className="text-lg text-[#c99716]">
                  ✦
                </span>

              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-[#eadfca] bg-[#f1e8d7]">

                <span className="text-lg text-[#c99716]">
                  ✦
                </span>

              </div>

            </div>


            {/* MAIN IMAGE */}

            <div className="relative order-1 aspect-square overflow-hidden rounded-2xl bg-[#f1e8d7] sm:order-2">

              <div className="flex h-full items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#d1a11c] text-3xl text-[#c99716]">
                    ✦
                  </div>

                  <p className="text-xs uppercase tracking-[2px] text-[#9b8a70]">
                    Product Image
                  </p>

                </div>

              </div>


              {/* WISHLIST */}

              <button
                type="button"
                aria-label="Add to wishlist"
                className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-[#81786d] shadow-md transition-colors hover:text-[#c99716]"
              >
                ♡
              </button>

            </div>

          </div>


          {/* =================================================
              PRODUCT INFORMATION
          ================================================== */}

          <div className="flex flex-col justify-center">

            {/* CATEGORY */}

            <p className="text-xs font-medium uppercase tracking-[3px] text-[#c99716]">
              {product.category}
            </p>


            {/* NAME */}

            <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#29251f] sm:text-4xl">
              {product.name}
            </h1>


            {/* RATING */}

            <div className="mt-4 flex items-center gap-3">

              <div className="flex gap-1 text-[#d1a11c]">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>

              <span className="text-sm font-medium text-[#5f584f]">
                4.8
              </span>

              <Link
                href="#reviews"
                className="text-sm text-[#91887c] underline-offset-4 hover:underline"
              >
                42 reviews
              </Link>

            </div>


            {/* PRICE */}

            <p className="mt-6 text-2xl font-semibold text-[#a9780d]">
              ₹{product.price.toLocaleString("en-IN")}
            </p>


            <div className="my-7 border-t border-[#eee5d2]" />


            {/* DESCRIPTION */}

            <div>

              <h2 className="text-sm font-semibold text-[#29251f]">
                Description
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#686159]">
                {product.description}
              </p>

            </div>


            {/* COLOUR */}

            {product.colour && (
              <div className="mt-7">

                <div className="flex items-center justify-between">

                  <p className="text-sm font-semibold text-[#29251f]">
                    Colour
                  </p>

                  <span className="text-sm text-[#756d63]">
                    {product.colour}
                  </span>

                </div>

                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d1a11c] bg-[#d8ae46]">
                  <span className="sr-only">
                    {product.colour}
                  </span>
                </div>

              </div>
            )}


            {/* QUANTITY */}

            <div className="mt-7">

              <p className="text-sm font-semibold text-[#29251f]">
                Quantity
              </p>

              <div className="mt-3 flex w-fit items-center rounded-lg border border-[#dfd2bb] bg-white">

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center text-[#756d63] hover:text-[#a9780d]"
                >
                  −
                </button>

                <span className="w-10 text-center text-sm">
                  1
                </span>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center text-[#756d63] hover:text-[#a9780d]"
                >
                  +
                </button>

              </div>

            </div>


            {/* ACTIONS */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                className="flex-1 rounded-lg bg-[#d1a11c] px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#bd8d0f] hover:shadow-lg"
              >
                Add to Cart
              </button>

              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#d9bf7c] bg-white text-xl text-[#81786d] transition-colors hover:text-[#c99716]"
                aria-label="Add to wishlist"
              >
                ♡
              </button>

            </div>


            {/* BUY NOW */}

            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-[#d1a11c] bg-[#fffaf0] py-3.5 text-sm font-medium text-[#9b6d0d] transition-colors hover:bg-[#fff3d6]"
            >
              Buy Now
            </button>


            {/* TRUST */}

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#eee5d2] pt-6">

              <TrustItem
                icon="◇"
                title="Secure"
                description="Payments"
              />

              <TrustItem
                icon="↝"
                title="Easy"
                description="Returns"
              />

              <TrustItem
                icon="✦"
                title="Quality"
                description="Crafted"
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PRODUCT DETAILS
      ====================================================== */}

      { (product.details || product.material || product.dimensions || product.colour || product.care) && (
        <section className="border-y border-[#eee5d2] bg-white px-6 py-14 lg:px-10">

          <div className="mx-auto max-w-[1100px]">

            <div className="grid gap-10 md:grid-cols-2">

              <div>

                <p className="text-xs font-medium uppercase tracking-[3px] text-[#c99716]">
                  Details
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-[#29251f]">
                  Made with intention
                </h2>
                
                {product.details && (
                  <p className="mt-5 text-sm leading-7 text-[#686159]">
                    {product.details}
                  </p>
                )}

              </div>


              <div className="rounded-2xl border border-[#eadfca] bg-[#fffdf8] p-6">

                {product.material && (
                  <DetailRow
                    label="Material"
                    value={product.material}
                  />
                )}

                {product.dimensions && (
                  <DetailRow
                    label="Dimensions"
                    value={product.dimensions}
                  />
                )}

                {product.colour && (
                  <DetailRow
                    label="Colour"
                    value={product.colour}
                  />
                )}

                {product.care && (
                  <DetailRow
                    label="Care"
                    value={product.care}
                  />
                )}

              </div>

            </div>

          </div>

        </section>
      )}


      {/* =====================================================
          REVIEWS
      ====================================================== */}

      <section
        id="reviews"
        className="bg-[#f8f2e6] px-6 py-14 lg:px-10"
      >

        <div className="mx-auto max-w-[1100px]">

          <div className="text-center">

            <p className="text-xs font-medium uppercase tracking-[3px] text-[#c99716]">
              Customer feedback
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-[#29251f]">
              What customers say
            </h2>

          </div>


          <div className="mt-8 grid gap-5 md:grid-cols-3">

            <Review
              name="Ananya R."
              review="Beautiful craftsmanship and even better in person."
            />

            <Review
              name="Meera S."
              review="The quality feels premium and the packaging was lovely."
            />

            <Review
              name="Riya K."
              review="A beautiful addition to my home. Would definitely recommend."
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          YOU MAY ALSO LIKE
      ====================================================== */}

      <section className="bg-white px-6 py-14 lg:px-10">

        <div className="mx-auto max-w-[1300px]">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-xs font-medium uppercase tracking-[3px] text-[#c99716]">
                Curated for you
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-[#29251f]">
                You may also like
              </h2>

            </div>

            <Link
              href="/shop"
              className="text-sm font-medium text-[#a9780d] hover:text-[#7f5c08]"
            >
              View all →
            </Link>

          </div>


          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

            <RecommendationCard
              name="Handwoven Table Runner"
              price="₹1,299"
            />

            <RecommendationCard
              name="Artisan Ceramic Mug"
              price="₹699"
            />

            <RecommendationCard
              name="Heritage Candle Set"
              price="₹999"
            />

            <RecommendationCard
              name="Hand-Painted Ceramic Vase"
              price="₹1,799"
            />

          </div>

        </div>

      </section>

    </main>
  );
}


/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-5 border-b border-[#eee5d2] py-4 last:border-b-0">

      <span className="text-sm text-[#91887c]">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-[#3b342b]">
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({ icon, title, description }) {
  return (
    <div className="text-center">

      <div className="text-lg text-[#c99716]">
        {icon}
      </div>

      <p className="mt-1 text-xs font-medium text-[#3b342b]">
        {title}
      </p>

      <p className="text-[10px] text-[#91887c]">
        {description}
      </p>

    </div>
  );
}


/* =========================================================
   REVIEW
========================================================= */

function Review({ name, review }) {
  return (
    <div className="rounded-xl border border-[#eadfca] bg-white p-5">

      <div className="flex gap-1 text-xs text-[#d1a11c]">
        ★ ★ ★ ★ ★
      </div>

      <p className="mt-4 text-sm leading-6 text-[#686159]">
        “{review}”
      </p>

      <p className="mt-4 text-xs font-semibold text-[#3b342b]">
        {name}
      </p>

      <p className="mt-1 text-[10px] text-[#91887c]">
        Verified Customer
      </p>

    </div>
  );
}


/* =========================================================
   RECOMMENDATION CARD
========================================================= */

function RecommendationCard({ name, price }) {
  return (
    <Link
      href="/shop"
      className="group overflow-hidden rounded-xl border border-[#eadfca] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >

      <div className="flex aspect-square items-center justify-center bg-[#f1e8d7]">

        <div className="text-center">

          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#d1a11c] text-[#c99716]">
            ✦
          </div>

          <p className="text-[9px] uppercase tracking-[1.5px] text-[#9b8a70]">
            Product Image
          </p>

        </div>

      </div>

      <div className="p-4">

        <h3 className="text-xs font-medium text-[#3b342b]">
          {name}
        </h3>

        <p className="mt-2 text-sm font-semibold text-[#a9780d]">
          {price}
        </p>

      </div>

    </Link>
  );
}