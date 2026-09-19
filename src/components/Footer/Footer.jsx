import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="bg-[#3F5144] text-white"
      style={{ backgroundColor: "#3F5144", color: "#FFFFFF" }}
    >
      <div className="mx-auto max-w-7xl px-8 py-12">

        <div className="flex flex-col justify-between gap-10 md:flex-row">

          {/* BRAND */}
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: "#F2C9B9" }}
            >
              VRHAZ
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">
              A modern marketplace bringing thoughtfully made products
              inspired by Indian heritage into everyday living.
            </p>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3
              className="mb-4 font-semibold"
              style={{ color: "#F2C9B9" }}
            >
              Quick Links
            </h3>

            <ul className="space-y-2 text-sm text-white/85">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-[#F2C9B9]"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/shop"
                  className="transition-colors hover:text-[#F2C9B9]"
                >
                  Shop
                </Link>
              </li>

              <li>
                <Link
                  href="/shop?category=clothing"
                  className="transition-colors hover:text-[#F2C9B9]"
                >
                  Sarees
                </Link>
              </li>

              <li>
                <Link
                  href="/shop?category=home-living"
                  className="transition-colors hover:text-[#F2C9B9]"
                >
                  Baskets
                </Link>
              </li>

              <li>
                <Link
                  href="/shop?category=toys"
                  className="transition-colors hover:text-[#F2C9B9]"
                >
                  Toys
                </Link>
              </li>

              <li>
                <Link
                  href="/#about"
                  className="transition-colors hover:text-[#F2C9B9]"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3
              className="mb-4 font-semibold"
              style={{ color: "#F2C9B9" }}
            >
              Contact
            </h3>

            <div className="space-y-2 text-sm text-white/80">
              <p>support@mavidhai.com</p>
              <p>Hyderabad, India</p>
            </div>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div
          className="mt-10 border-t pt-5 text-center text-xs text-white/70"
          style={{ borderColor: "#A8B39F" }}
        >
          © 2026 VRHAZ. All rights reserved.
        </div>

      </div>
    </footer>
  );
}