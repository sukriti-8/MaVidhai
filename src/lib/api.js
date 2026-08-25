const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getProducts(params = {}, signal) {
  const searchParams = new URLSearchParams();

  if (params.category) {
    searchParams.set("category", params.category);
  }
  if (params.minPrice !== undefined && params.minPrice !== "") {
    searchParams.set("min_price", params.minPrice);
  }
  if (params.maxPrice !== undefined && params.maxPrice !== "") {
    searchParams.set("max_price", params.maxPrice);
  }
  if (params.available !== undefined && params.available !== false) {
    searchParams.set("available", String(params.available));
  }
  
  searchParams.set("page", params.page ?? 1);
  searchParams.set("limit", params.limit ?? 20);

  const response = await fetch(
    `${API_URL}/api/products?${searchParams.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export async function getProductBySlug(slug, signal) {
  const response = await fetch(
    `${API_URL}/api/products/${encodeURIComponent(slug)}`,
    { signal }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch product");
  }

  return response.json();
}
