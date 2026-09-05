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
export async function getCategories(signal) {
  const response = await fetch(`${API_URL}/api/categories`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
}

export async function getWishlist() {
  const response = await fetch(`${API_URL}/api/wishlist`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to fetch wishlist");
  }
  return response.json();
}

export async function removeFromWishlist(itemId) {
  const response = await fetch(`${API_URL}/api/wishlist/items/${itemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to remove wishlist item");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wishlist-updated"));
  }

  return response.json();
}

export function setAuthToken(token) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("mavidhai_token", token);
    } else {
      localStorage.removeItem("mavidhai_token");
    }
    window.dispatchEvent(new Event("auth-changed"));
  }
}

export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("mavidhai_token");
  }
  return null;
}
export async function getCurrentUser() {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to fetch current user");
  }

  return response.json();
}
function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }

  const data = await response.json();

  setAuthToken(data.access_token);

  const user = await getCurrentUser();

  if (typeof window !== "undefined") {
    localStorage.setItem("mavidhai_user", JSON.stringify(user));
    window.dispatchEvent(new Event("mavidhai-auth-changed"));
  }

  return {
    ...data,
    user,
  };
}

export async function signup(fullName, email, password) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: fullName, email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Signup failed");
  }
  
  return response.json();
}

export async function getCart() {
  const response = await fetch(`${API_URL}/api/cart`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to fetch cart");
  }
  return response.json();
}

export async function updateCartItem(itemId, quantity) {
  const response = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ quantity }),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to update cart item");
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
  return response.json();
}

export async function removeCartItem(itemId) {
  const response = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to remove cart item");
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
  return response.json();
}

export async function addToCart(productId, quantity) {
  const response = await fetch(`${API_URL}/api/cart/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to add to cart");
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
  return response.json();
}

export async function addToWishlist(productId) {
  const response = await fetch(`${API_URL}/api/wishlist/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(), 
    },
    body: JSON.stringify({ product_id: productId }),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to add to wishlist");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wishlist-updated"));
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

export async function createOrder(shippingData) {
  const response = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(shippingData),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to create order");
  }
  return response.json();
}

export async function getOrder(orderNumber) {
  const response = await fetch(`${API_URL}/api/orders/${orderNumber}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    if (response.status === 404) return null;
    throw new Error("Failed to fetch order");
  }
  return response.json();
}

export async function getOrders(page = 1, limit = 20) {
  const response = await fetch(`${API_URL}/api/orders?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to fetch orders");
  }
  return response.json();
}

export async function createPayment(orderNumber) {
  const response = await fetch(`${API_URL}/api/payments/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ order_number: orderNumber }),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to create payment intent");
  }
  return response.json();
}

export async function verifyPayment(paymentData) {
  const response = await fetch(`${API_URL}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(paymentData),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Payment verification failed");
  }
  return response.json();
}