export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="max-w-7xl mx-auto px-8 py-10">

        <div className="flex flex-col md:flex-row justify-between gap-8">

          <div>
            <h2 className="text-2xl font-bold text-[#C9A227]">
              MaVidhai
            </h2>

            <p className="text-gray-600 mt-3 max-w-sm">
              A modern marketplace connecting customers with quality products.
            </p>
          </div>


          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Quick Links
            </h3>

            <ul className="space-y-2 text-gray-600">
              <li>Home</li>
              <li>Shop</li>
              <li>Categories</li>
              <li>Contact</li>
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


        <div className="border-t border-gray-200 mt-8 pt-5 text-center text-gray-500">
          © 2026 MaVidhai. All rights reserved.
        </div>

      </div>
    </footer>
  );
}