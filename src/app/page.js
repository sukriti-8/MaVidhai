import Link from "next/link";
import { getProducts } from "@/lib/api";
import theme from "@/styles/theme";
import ProductCard from "@/components/Home/ProductCard";

export default async function Home() {
  let products = [];

  try {
    const data = await getProducts({
      page: 1,
      limit: 4,
    });

    products = data?.items || data?.products || (Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Failed to load featured products:", error);
  }

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: theme.colors.ivory,
        color: theme.colors.charcoal,
      }}
    >
      {/* TOP BANNER */}
      <section
        className="px-6 py-3 text-center text-xs font-medium tracking-wide"
        style={{
          backgroundColor: theme.colors.peach,
          color: theme.colors.charcoal,
        }}
      >
        Made in India. Made thoughtfully. Made for every home.
      </section>

      {/* HERO */}
      <section
        className="px-6 py-0 lg:px-10"
        style={{ backgroundColor: theme.colors.ivory }}
      >
        <div className="mx-auto grid max-w-[1450px] items-stretch lg:grid-cols-2">
          <div className="flex flex-col justify-center py-16 lg:px-8 lg:py-24">
            <p
              className="mb-4 text-xs font-medium uppercase tracking-[3px]"
              style={{ color: theme.colors.terracotta }}
            >
              Rooted in tradition
            </p>

            <h1
              className="max-w-xl text-4xl font-medium leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl"
              style={{
                color: theme.colors.charcoal,
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
              style={{ color: theme.colors.charcoal }}
            >
              Handloom sarees, rope storage baskets, and more to come —
              sourced directly from artisans across India, in sustainable
              materials, finished with care.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex px-7 py-3.5 text-xs font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-2 focus:outline-offset-2"
                style={{
                  backgroundColor: theme.colors.forest,
                  color: theme.colors.white,
                  outlineColor: theme.colors.charcoal,
                }}
              >
                Explore Collection
              </Link>

              <Link
                href="/#about"
                className="inline-flex items-center border px-7 py-3.5 text-xs font-semibold uppercase tracking-[1.5px] transition-colors hover:bg-white focus:outline-2 focus:outline-offset-2"
                style={{
                  borderColor: theme.colors.terracotta,
                  color: theme.colors.terracotta,
                  outlineColor: theme.colors.charcoal,
                }}
              >
                Learn Our Story
              </Link>
            </div>
          </div>

          <div
            className="relative min-h-[380px] overflow-hidden"
            style={{ backgroundColor: theme.colors.peach }}
          >
            <img
              src="/images/hero.png"
              alt="Handcrafted MaVidhai collection"
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="scroll-mt-24 border-y px-6 py-16 lg:px-10"
        style={{
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.sage,
        }}
      >
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-10 text-center">
            <p
              className="text-xs font-medium uppercase tracking-[3px]"
              style={{ color: theme.colors.terracotta }}
            >
              Explore
            </p>

            <h2
              className="mt-2 text-3xl font-semibold"
              style={{ color: theme.colors.charcoal }}
            >
              Shop by Category
            </h2>

            <p
              className="mx-auto mt-3 max-w-xl text-sm leading-6"
              style={{ color: theme.colors.charcoal }}
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
              image="/sarees/saree1.jpeg"
              background={theme.colors.peach}
            />

            <CategoryCard
              title="Home & Living"
              description="Thoughtfully crafted pieces for beautiful everyday spaces."
              href="/shop?category=home-and-living"
              image="/rope-basket/basket-1.jpeg"
              background={theme.colors.sage}
            />

            <CategoryCard
              title="Toys"
              description="Thoughtful toys inspired by simple, meaningful play."
              href="/shop?category=toys"
              background={theme.colors.peach}
            />
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section
        className="mx-auto max-w-[1450px] px-6 py-16 lg:px-10"
        style={{ backgroundColor: theme.colors.ivory }}
      >
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-[3px]"
              style={{ color: theme.colors.terracotta }}
            >
              Curated for you
            </p>

            <h2
              className="mt-2 text-3xl font-semibold"
              style={{ color: theme.colors.charcoal }}
            >
              Featured Products
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden text-sm font-medium transition-colors hover:underline focus:outline-2 focus:outline-offset-2 sm:block"
            style={{
              color: theme.colors.terracotta,
              outlineColor: theme.colors.charcoal,
            }}
          >
            View All →
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id || product._id || product.slug}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div
            className="border p-8 text-center"
            style={{
              borderColor: theme.colors.sage,
              backgroundColor: theme.colors.white,
            }}
          >
            <p
              className="text-sm"
              style={{ color: theme.colors.charcoal }}
            >
              Explore our collection to discover thoughtfully made products.
            </p>

            <Link
              href="/shop"
              className="mt-4 inline-block text-sm font-semibold underline"
              style={{ color: theme.colors.terracotta }}
            >
              Browse the collection
            </Link>
          </div>
        )}
      </section>

      {/* CUSTOMER REVIEWS */}
      <section
        className="border-y px-6 py-16 lg:px-10"
        style={{
          backgroundColor: theme.colors.sage,
          borderColor: theme.colors.sage,
        }}
      >
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-10 text-center">
            <p
              className="text-xs font-medium uppercase tracking-[3px]"
              style={{ color: theme.colors.terracotta }}
            >
              Loved by our customers
            </p>

            <h2
              className="mt-2 text-3xl font-semibold"
              style={{ color: theme.colors.charcoal }}
            >
              What Our Customers Say
            </h2>

            <p
              className="mx-auto mt-3 max-w-xl text-sm leading-6"
              style={{ color: theme.colors.charcoal }}
            >
              Experiences from people who have welcomed MaVidhai into their
              everyday lives.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <ReviewCard
              review="Beautifully crafted and thoughtfully finished. The quality feels special."
              name="A Happy Customer"
              location="India"
            />

            <ReviewCard
              review="The product feels carefully made and fits naturally into my home."
              name="A Happy Customer"
              location="India"
            />

            <ReviewCard
              review="I appreciate the craftsmanship and the attention to detail."
              name="A Happy Customer"
              location="India"
            />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="scroll-mt-24 px-6 py-16 lg:px-10"
        style={{ backgroundColor: theme.colors.white }}
      >
        <div className="mx-auto grid max-w-[1300px] items-center gap-10 lg:grid-cols-2">
          <div
            className="flex min-h-[360px] items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.colors.peach }}
          >
            <div className="text-center">
              <div
                className="mx-auto mb-4 text-4xl"
                style={{ color: theme.colors.terracotta }}
              >
                ✦
              </div>

              <p
                className="text-sm font-medium uppercase tracking-[2px]"
                style={{ color: theme.colors.charcoal }}
              >
                Our Story
              </p>

              <p
                className="mt-2 text-xs"
                style={{ color: theme.colors.charcoal }}
              >
                Made in India
              </p>
            </div>
          </div>

          <div>
            <p
              className="text-xs font-medium uppercase tracking-[3px]"
              style={{ color: theme.colors.terracotta }}
            >
              Our Story
            </p>

            <h2
              className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl"
              style={{ color: theme.colors.charcoal }}
            >
              Everything we offer is made in India.
            </h2>

            <p
              className="mt-6 text-sm leading-7"
              style={{ color: theme.colors.charcoal }}
            >
              Some pieces are woven and shaped by hand. Others come from small
              workshops with the tools to finish them beautifully. Both take
              skill, and we carry them side by side.
            </p>

            <p
              className="mt-4 text-sm leading-7"
              style={{ color: theme.colors.charcoal }}
            >
              India&apos;s artisans are everywhere — a weaver in one district,
              a basket-maker in another, potters and woodworkers in the next.
              We travel out to find them and bring their work here, sourcing
              directly so their craft reaches you just as it left their hands.
            </p>

            <p
              className="mt-4 text-sm leading-7"
              style={{ color: theme.colors.charcoal }}
            >
              We choose materials that are gentle on the earth: natural
              fibres, sustainable, and finished with care.
            </p>

            <p
              className="mt-4 text-sm leading-7"
              style={{ color: theme.colors.charcoal }}
            >
              We began with handloom sarees and rope storage baskets. Clay,
              wood and much more will follow.
            </p>

            <p
              className="mt-4 text-sm leading-7"
              style={{ color: theme.colors.charcoal }}
            >
              Our promise is simple. We never compromise on quality. A
              beautiful thing should be able to find a place in any home.
            </p>

            <p
              className="mt-5 text-sm font-medium leading-7"
              style={{ color: theme.colors.terracotta }}
            >
              Made in India. Made thoughtfully. Made for every home.
            </p>
          </div>
        </div>
      </section>

      {/* WHY MAVIDHAI */}
      <section
        className="px-6 py-16 lg:px-10"
        style={{ backgroundColor: theme.colors.ivory }}
      >
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-10 text-center">
            <p
              className="text-xs font-medium uppercase tracking-[3px]"
              style={{ color: theme.colors.terracotta }}
            >
              Why MaVidhai
            </p>

            <h2
              className="mt-2 text-3xl font-semibold"
              style={{ color: theme.colors.charcoal }}
            >
              Made with meaning
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="♡"
              title="Handcrafted"
              description="Made with care by skilled artisans."
            />

            <FeatureCard
              icon="✦"
              title="Heritage Inspired"
              description="Inspired by culture and timeless traditions."
            />

            <FeatureCard
              icon="♧"
              title="Conscious Choices"
              description="Thoughtful products for modern living."
            />

            <FeatureCard
              icon="✧"
              title="Made in India"
              description="Supporting local makers and communities."
            />
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section
        className="px-6 py-8 lg:px-10"
        style={{ backgroundColor: theme.colors.sage }}
      >
        <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-6 text-center md:grid-cols-4">
          <Benefit title="Pan India Delivery" />
          <Benefit title="Secure Payments" />
          <Benefit title="Easy Returns" />
          <Benefit title="Thoughtful Packaging" />
        </div>
      </section>

      {/* NEWSLETTER */}
      <section
        className="border-y px-6 py-12 lg:px-10"
        style={{
          backgroundColor: theme.colors.peach,
          borderColor: theme.colors.peach,
        }}
      >
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <p
              className="text-lg font-semibold"
              style={{ color: theme.colors.charcoal }}
            >
              Stay connected with MaVidhai
            </p>

            <p
              className="mt-1 text-sm"
              style={{ color: theme.colors.charcoal }}
            >
              Be the first to know about new collections and stories.
            </p>
          </div>

          <form className="flex w-full max-w-md gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>

            <input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-lg border px-4 py-3 text-sm outline-none focus:outline-2 focus:outline-offset-2"
              style={{
                borderColor: theme.colors.sage,
                backgroundColor: theme.colors.white,
                color: theme.colors.charcoal,
                outlineColor: theme.colors.charcoal,
              }}
            />

            <button
              type="submit"
              className="rounded-lg px-5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-2 focus:outline-offset-2"
              style={{
                backgroundColor: theme.colors.forest,
                color: theme.colors.white,
                outlineColor: theme.colors.charcoal,
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

/* CATEGORY CARD */
function CategoryCard({
  title,
  description,
  href,
  image,
  background = theme.colors.peach,
}) {
  return (
    <Link
      href={href}
      className="group block min-w-0 overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-2 focus:outline-offset-2"
      style={{
        borderColor: theme.colors.sage,
        backgroundColor: theme.colors.white,
        outlineColor: theme.colors.charcoal,
      }}
    >
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ backgroundColor: background }}
      >
        {image ? (
          <img
            src={image}
            alt={`${title} products`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-[180px] items-center justify-center">
            <div className="text-center">
              <div
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border text-xl"
                style={{
                  borderColor: theme.colors.charcoal,
                  color: theme.colors.terracotta,
                }}
              >
                ✦
              </div>

              <p
                className="text-[10px] uppercase tracking-[2px]"
                style={{ color: theme.colors.charcoal }}
              >
                Coming Soon
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3
          className="text-base font-semibold"
          style={{ color: theme.colors.charcoal }}
        >
          {title}
        </h3>

        <p
          className="mt-2 text-xs leading-5"
          style={{ color: theme.colors.charcoal }}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}

/* REVIEW CARD */
function ReviewCard({ review, name, location }) {
  return (
    <div
      className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{
        borderColor: theme.colors.sage,
        backgroundColor: theme.colors.white,
      }}
    >
      <div
        className="flex gap-1"
        style={{ color: theme.colors.terracotta }}
        aria-label="5 out of 5 stars"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index}>★</span>
        ))}
      </div>

      <p
        className="mt-5 text-sm leading-7"
        style={{ color: theme.colors.charcoal }}
      >
        “{review}”
      </p>

      <div
        className="mt-6 flex items-center gap-3 border-t pt-5"
        style={{ borderColor: theme.colors.sage }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
          style={{
            backgroundColor: theme.colors.peach,
            color: theme.colors.charcoal,
          }}
        >
          {name.charAt(0)}
        </div>

        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: theme.colors.charcoal }}
          >
            {name}
          </p>

          <p
            className="text-xs"
            style={{ color: theme.colors.charcoal }}
          >
            Customer · {location}
          </p>
        </div>
      </div>
    </div>
  );
}

/* FEATURE CARD */
function FeatureCard({ icon, title, description }) {
  return (
    <div
      className="rounded-xl border p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      style={{
        borderColor: theme.colors.sage,
        backgroundColor: theme.colors.white,
      }}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border text-xl"
        style={{
          borderColor: theme.colors.sage,
          color: theme.colors.terracotta,
        }}
      >
        {icon}
      </div>

      <h3
        className="mt-4 text-sm font-semibold"
        style={{ color: theme.colors.charcoal }}
      >
        {title}
      </h3>

      <p
        className="mt-2 text-xs leading-5"
        style={{ color: theme.colors.charcoal }}
      >
        {description}
      </p>
    </div>
  );
}

/* BENEFIT */
function Benefit({ title }) {
  return (
    <div>
      <p
        className="text-sm font-semibold"
        style={{ color: theme.colors.charcoal }}
      >
        {title}
      </p>
    </div>
  );
}