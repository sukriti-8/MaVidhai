import Link from "next/link";
export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200 px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        <h1 className="text-2xl font-bold text-[#C9A227]">
          MaVidhai
        </h1>

        <div className="flex gap-8 text-gray-700">
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/deals">Deals</Link>
          <Link href="/about">About</Link>
        </div>

        <div className="flex gap-4">
          <button className="text-gray-700">
            Login
          </button>

          <button className="bg-[#C9A227] text-white px-5 py-2 rounded-xl">
            Sign Up
          </button>
        </div>

      </div>
    </nav>
  );
}