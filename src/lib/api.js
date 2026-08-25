const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getProducts(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.category) {
    searchParams.set("category", params.category);
  }
  if (params.min_price !== undefined) {
    searchParams.set("min_price", params.min_price);
  }
  if (params.max_price !== undefined) {
    searchParams.set("max_price", params.max_price);
  }
  if (params.available !== undefined) {
    searchParams.set("available", params.available);
  }
  
  searchParams.set("page", params.page ?? 1);
  searchParams.set("limit", params.limit ?? 20);

  const response = await fetch(
    `${API_URL}/api/products?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}
