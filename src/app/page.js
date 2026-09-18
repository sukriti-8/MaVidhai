import Link from "next/link";
import { getProducts } from "@/lib/api";

const colors = {
  ivory: "#F8F6F2",
  white: "#FFFFFF",
  peach: "#F2C9B9",
  terracotta: "#A85838",
  sage: "#A8B39F",
  forest: "#3F5144",
  charcoal: "#1D1D1B",
};

export default async function Home() {
  const data = await getProducts({
    page: 1,
    limit: 4,
  });

  const products = data.items || data;

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: colors.ivory,
        color: colors.charcoal,
      }}
    >
      <section
        className="px-6 py-3 text-center text-xs font-medium tracking-wide"
        style={{
          backgroundColor: colors.peach,
          color: colors.charcoal,
        }}
      >
        Made in India. Made thoughtfully. Made for every home.
      </section>

      <section
        className="px-6 py-0 lg:px-10"
        style={{ backgroundColor: colors.ivory }}
      >
        <div className="mx-auto grid max-w-[1450px] items-stretch lg:grid-cols-2">
          <div className="flex flex-col justify-center py-16 lg:px-8 lg:py-24">
            <h1
              className="max-w-xl text-4xl font-medium leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl"
              style={{
                color: colors.charcoal,
                fontFamily: "Georgia, serif",
              }}
            >
              Made in India.
              <br />
              Made thoughtfully.
              <br />
              Made for every home.
            </h1>

            <p
              className="mt-7 max-w-lg text-sm leading-7 sm:text-base"
              style={{ color: colors.charcoal }}
            >
              Handloom sarees, rope storage baskets, and more to come —
              sourced directly from artisans across India, in sustainable
              materials, finished with care.
            </p>

            <div className="mt-8">
              <Link
                href="/shop"
                className="inline-flex px-7 py-3.5 text-xs font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-2 focus:outline-offset-2"
                style={{
                  backgroundColor: colors.peach,
                  color: colors.white,
                  outlineColor: colors.charcoal,
                }}
              >
                Shop Collection
              </Link>
            </div>
          </div>

          <div className="relative min-h-[420px] lg:min-h-[560px]">
            <img
              src="/images/hero.png"
              alt="VRHAZ handcrafted Indian products"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section
        id="categories"
        className="border-y px-6 py-16 lg:px-10"
        style={{
          backgroundColor: colors.white,
          borderColor: colors.sage,
        }}
      >
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-10 text-center">
            <p
              className="text-xs font-medium uppercase tracking-[3px]"
              style={{ color: colors.terracotta }}
            >
              Explore
            </p>

            <h2
              className="mt-2 text-3xl font-semibold"
              style={{ color: colors.charcoal }}
            >
              Shop by Category
            </h2>

            <p
              className="mx-auto mt-3 max-w-xl text-sm leading-6"
              style={{ color: colors.charcoal }}
            >
              Everyday pieces thoughtfully chosen for how you live, wear and
              celebrate.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-3">
            <CategoryCard
              title="Sarees"
              description="Timeless Indian clothing for every occasion."
              href="/shop?category=sarees"
              background={colors.peach}
            />

            <CategoryCard
              title="Rope Baskets"
              description="Handcrafted home pieces with purpose."
              href="/shop?category=home-and-living"
              background={colors.sage}
            />

            <CategoryCard
              title="Wooden Toys"
              description="Thoughtful toys inspired by simple play."
              href="/shop?category=toys"
              background={colors.peach}
            />
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-[1450px] px-6 py-16 lg:px-10"
        style={{ backgroundColor: colors.ivory }}
      >
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-[3px]"
              style={{ color: colors.terracotta }}
            >
              Curated for you
            </p>

            <h2
              className="mt-2 text-3xl font-semibold"
              style={{ color: colors.charcoal }}
            >
              Featured Products
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden text-sm font-medium transition-colors sm:block focus:outline-2 focus:outline-offset-2"
            style={{
              color: colors.terracotta,
              outlineColor: colors.charcoal,
            }}
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
        </div>
      </section>

      <section
        className="border-y px-6 py-16 lg:px-10"
        style={{
          backgroundColor: colors.sage,
          borderColor: colors.sage,
        }}
      >
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-10 text-center">
            <p
              className="text-xs font-medium uppercase tracking-[3px]"
              style={{ color: colors.terracotta }}
            >
              Loved by our customers
            </p>

            <h2
              className="mt-2 text-3xl font-semibold"
              style={{ color: colors.charcoal }}
            >
              What Our Customers Say
            </h2>

            <p
              className="mx-auto mt-3 max-w-xl text-sm leading-6"
              style={{ color: colors.charcoal }}
            >
              Experiences from people who have welcomed VRHAZ into their
              everyday lives.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <ReviewCard
              review="The craftsmanship is beautiful. Everything feels thoughtfully made and the quality is even better in person."
              name="Ananya R."
              location="Hyderabad"
            />

            <ReviewCard
              review="I loved how easy the whole shopping experience was. The products feel unique without being difficult to use every day."
              name="Meera S."
              location="Bengaluru"
            />

            <ReviewCard
              review="Finally found a place where traditional inspiration and modern design come together so naturally."
              name="Riya K."
              location="Mumbai"
            />
          </div>
        </div>
      </section>

      <section
          id="about"
          className="scroll-mt-24 px-6 py-16 lg:px-10"
          style={{ backgroundColor: colors.white }}
        >
          <div className="mx-auto grid max-w-[1300px] items-center gap-10 lg:grid-cols-2">
            <div
              className="flex min-h-[360px] items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.peach }}
            >
              <div className="text-center">
                <div
                  className="mx-auto mb-4 text-4xl"
                  style={{ color: colors.terracotta }}
                >
                  ✦
                </div>

                <p
                  className="text-sm font-medium uppercase tracking-[2px]"
                  style={{ color: colors.charcoal }}
                >
                  Our Story
                </p>

                <p
                  className="mt-2 text-xs"
                  style={{ color: colors.charcoal }}
                >
                  Made in India
                </p>
              </div>
            </div>

            <div>
              <p
                className="text-xs font-medium uppercase tracking-[3px]"
                style={{ color: colors.terracotta }}
              >
                Our Story
              </p>

              <h2
                className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl"
                style={{ color: colors.charcoal }}
              >
                Everything we offer is made in India.
              </h2>

              <p
                className="mt-6 text-sm leading-7"
                style={{ color: colors.charcoal }}
              >
                Some pieces are woven and shaped by hand. Others come from small
                workshops with the tools to finish them beautifully. Both take skill,
                and we carry them side by side.
              </p>

              <p
                className="mt-4 text-sm leading-7"
                style={{ color: colors.charcoal }}
              >
                India&apos;s artisans are everywhere — a weaver in one district, a
                basket-maker in another, potters and woodworkers in the next. We travel
                out to find them and bring their work here, sourcing directly so their
                craft reaches you just as it left their hands.
              </p>

              <p
                className="mt-4 text-sm leading-7"
                style={{ color: colors.charcoal }}
              >
                We choose materials that are gentle on the earth: natural fibres,
                sustainable, and finished with care.
              </p>

              <p
                className="mt-4 text-sm leading-7"
                style={{ color: colors.charcoal }}
              >
                We began with handloom sarees and rope storage baskets. Clay, wood and
                much more will follow.
              </p>

              <p
                className="mt-4 text-sm leading-7"
                style={{ color: colors.charcoal }}
              >
                Our promise is simple. We never compromise on quality. A beautiful
                thing should be able to find a place in any home.
              </p>

              <p
                className="mt-5 text-sm font-medium leading-7"
                style={{ color: colors.terracotta }}
              >
                Made in India. Made thoughtfully. Made for every home.
              </p>
            </div>
          </div>
        </section>

      <section
        className="px-6 py-16 lg:px-10"
        style={{ backgroundColor: colors.ivory }}
      >
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-10 text-center">
            <p
              className="text-xs font-medium uppercase tracking-[3px]"
              style={{ color: colors.terracotta }}
            >
              Why VRHAZ
            </p>

            <h2
              className="mt-2 text-3xl font-semibold"
              style={{ color: colors.charcoal }}
            >
              Made with meaning
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="♡"
              title="Thoughtfully Made"
              description="Products chosen with care and purpose."
            />

            <FeatureCard
              icon="✦"
              title="Heritage Inspired"
              description="Inspired by Indian culture and craftsmanship."
            />

            <FeatureCard
              icon="♧"
              title="Conscious Choices"
              description="Meaningful products for modern living."
            />

            <FeatureCard
              icon="✧"
              title="Made in India"
              description="Celebrating local makers and traditions."
            />
          </div>
        </div>
      </section>

      <section
        className="px-6 py-8 lg:px-10"
        style={{ backgroundColor: colors.sage }}
      >
        <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-6 text-center md:grid-cols-4">
          <Benefit title="Pan India Delivery" />
          <Benefit title="Secure Payments" />
          <Benefit title="Easy Returns" />
          <Benefit title="Thoughtful Packaging" />
        </div>
      </section>

      <section
        className="border-y px-6 py-12 lg:px-10"
        style={{
          backgroundColor: colors.peach,
          borderColor: colors.peach,
        }}
      >
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <p
              className="text-lg font-semibold"
              style={{ color: colors.charcoal }}
            >
              Stay connected with VRHAZ
            </p>

            <p
              className="mt-1 text-sm"
              style={{ color: colors.charcoal }}
            >
              Be the first to know about new collections and stories.
            </p>
          </div>

          <div className="flex w-full max-w-md gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-lg border px-4 py-3 text-sm outline-none focus:outline-2 focus:outline-offset-2"
              style={{
                borderColor: colors.charcoal,
                backgroundColor: colors.white,
                color: colors.charcoal,
                outlineColor: colors.charcoal,
              }}
            />

            <button
              type="button"
              className="rounded-lg px-5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-2 focus:outline-offset-2"
              style={{
                backgroundColor: colors.forest,
                color: colors.white,
                outlineColor: colors.charcoal,
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function CategoryCard({ title, description, href, background }) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-2 focus:outline-offset-2"
      style={{
        borderColor: colors.charcoal,
        backgroundColor: colors.white,
        outlineColor: colors.charcoal,
      }}
    >
      <div
        className="flex aspect-[4/3] items-center justify-center"
        style={{ backgroundColor: background }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border text-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              borderColor: colors.charcoal,
              color: colors.charcoal,
            }}
          >
            ✦
          </div>

          <p
            className="text-[10px] uppercase tracking-[2px]"
            style={{ color: colors.charcoal }}
          >
            Collection
          </p>
        </div>
      </div>

      <div className="p-5">
        <h3
          className="text-base font-semibold"
          style={{ color: colors.charcoal }}
        >
          {title}
        </h3>

        <p
          className="mt-2 text-xs leading-5"
          style={{ color: colors.charcoal }}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}

function ProductCard({ product }) {
  return (
    <div
      className="group overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: colors.sage }}
    >
      <div className="relative">
        <Link href={`/product/${product.slug}`} className="block">

          {/* IMAGE */}
          <div
            className="flex aspect-square items-center justify-center overflow-hidden"
            style={{ backgroundColor: colors.sage }}
          >
            {product.image_url || product.image ? (
              <img
                src={product.image_url || product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="text-center">
                <div
                  className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border text-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    borderColor: colors.charcoal,
                    color: colors.charcoal,
                  }}
                >
                  ✦
                </div>

                <p
                  className="text-[10px] uppercase tracking-[1.5px]"
                  style={{ color: colors.charcoal }}
                >
                  Product Image
                </p>
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div className="p-4">
            <h3
              className="text-sm font-medium"
              style={{ color: colors.charcoal }}
            >
              {product.name}
            </h3>

            <p
              className="mt-2 text-sm font-semibold"
              style={{ color: colors.terracotta }}
            >
              ₹{Number(product.price || 0).toLocaleString("en-IN")}
            </p>
          </div>

        </Link>

        {/* WISHLIST */}
        <button
          type="button"
          aria-label={`Add ${product.name} to wishlist`}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors"
          style={{
            backgroundColor: colors.white,
            color: colors.charcoal,
          }}
        >
          ♡
        </button>
      </div>

      {/* ADD TO CART */}
      <div className="px-4 pb-4">
        <button
          type="button"
          className="w-full rounded-lg border py-2 text-xs font-medium transition-colors"
          style={{
            borderColor: colors.charcoal,
            color: colors.charcoal,
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function ReviewCard({ review, name, location }) {
  return (
    <div
      className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{
        borderColor: colors.sage,
        backgroundColor: colors.white,
      }}
    >
      <div
        className="flex gap-1"
        style={{ color: colors.terracotta }}
        aria-label="5 out of 5 stars"
      >
        <span>★</span>
        <span>★</span>
        <span>★</span>
        <span>★</span>
        <span>★</span>
      </div>

      <p
        className="mt-5 text-sm leading-7"
        style={{ color: colors.charcoal }}
      >
        “{review}”
      </p>

      <div
        className="mt-6 flex items-center gap-3 border-t pt-5"
        style={{ borderColor: colors.sage }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
          style={{
            backgroundColor: colors.peach,
            color: colors.charcoal,
          }}
        >
          {name.charAt(0)}
        </div>

        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: colors.charcoal }}
          >
            {name}
          </p>

          <p
            className="text-xs"
            style={{ color: colors.charcoal }}
          >
            Verified Customer · {location}
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div
      className="rounded-xl border p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      style={{
        borderColor: colors.sage,
        backgroundColor: colors.white,
      }}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border text-xl"
        style={{
          borderColor: colors.charcoal,
          color: colors.terracotta,
        }}
      >
        {icon}
      </div>

      <h3
        className="mt-4 text-sm font-semibold"
        style={{ color: colors.charcoal }}
      >
        {title}
      </h3>

      <p
        className="mt-2 text-xs leading-5"
        style={{ color: colors.charcoal }}
      >
        {description}
      </p>
    </div>
  );
}

function Benefit({ title }) {
  return (
    <div>
      <p
        className="text-sm font-semibold"
        style={{ color: colors.charcoal }}
      >
        {title}
      </p>
    </div>
  );
}