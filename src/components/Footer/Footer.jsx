export default function Footer() {
  return (
   <footer
    className="bg-white"
    style={{ color: "#1D1D1B" }}
  >
      <div className="max-w-7xl mx-auto px-8 py-10">

        <div className="flex flex-col md:flex-row justify-between gap-8">

          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: "#3F5144" }}
            >
              VRHAZ
            </h2>

            <p className="text-gray-600 mt-3 max-w-sm">
              A modern marketplace bringing thoughtfully made products
              inspired by Indian heritage into everyday living.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Quick Links
            </h3>

            <ul className="space-y-2 text-gray-600">
              <li>
                <a
                  href="/"
                  className="hover:underline focus:outline-2 focus:outline-offset-2"
                  style={{ outlineColor: "#1D1D1B" }}
                >
                  Home
                </a>
              </li>

              <li>
                <a
                  href="/shop"
                  className="hover:underline focus:outline-2 focus:outline-offset-2"
                  style={{ outlineColor: "#1D1D1B" }}
                >
                  Shop
                </a>
              </li>

              <li>
                <a
                  href="/shop?category=clothing"
                  className="hover:underline focus:outline-2 focus:outline-offset-2"
                  style={{ outlineColor: "#1D1D1B" }}
                >
                  Sarees
                </a>
              </li>

              <li>
                <a
                  href="/shop?category=home-living"
                  className="hover:underline focus:outline-2 focus:outline-offset-2"
                  style={{ outlineColor: "#1D1D1B" }}
                >
                  Baskets
                </a>
              </li>

              <li>
                <a
                  href="/shop?category=toys"
                  className="hover:underline focus:outline-2 focus:outline-offset-2"
                  style={{ outlineColor: "#1D1D1B" }}
                >
                  Toys
                </a>
              </li>

              <li>
                <a
                  href="/#about"
                  className="hover:underline focus:outline-2 focus:outline-offset-2"
                  style={{ outlineColor: "#1D1D1B" }}
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Contact
            </h3>

            <p className="text-gray-600">
              support@mavidhai.com
            </p>

            <p className="text-gray-600">
              Hyderabad, India
            </p>
          </div>

        </div>

        <div
          className="border-t mt-8 pt-5 text-center text-gray-500"
          style={{ borderColor: "#A8B39F" }}
        >
          © 2026 VRHAZ. All rights reserved.
        </div>

      </div>
    </footer>
  );
}