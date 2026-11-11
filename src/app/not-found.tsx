import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-5 py-28 text-center">
      <p className="text-7xl font-black tracking-tight text-brand-600">404</p>
      <h1 className="text-2xl font-black tracking-tight text-ink-950">
        We could not find that page
      </h1>
      <p className="max-w-md text-sm text-ink-500">
        The product may have been renamed or removed. Try searching the
        catalogue or head back to the home page.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          <Home className="h-4 w-4" /> Home
        </Link>
        <Link href="/products" className="btn btn-outline">
          <Search className="h-4 w-4" /> Browse products
        </Link>
      </div>
    </div>
  );
}
