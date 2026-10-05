const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("mavidhai_token");

  if (!token || token === "null" || token === "undefined") {
    return null;
  }

  return token;
}

function getAuthHeaders() {
  const token = getAuthToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (!headers["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (typeof errorData?.detail === "string") {
        message = errorData.detail;
      } else if (typeof errorData?.message === "string") {
        message = errorData.message;
      }
    } catch {
      // Keep the default error message.
    }

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mavidhai_token");
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint, options) =>
    request(endpoint, {
      ...options,
      method: "GET",
    }),

  post: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (endpoint, options) =>
    request(endpoint, {
      ...options,
      method: "DELETE",
    }),
};

// -------------------------------------------------------------
// Customer / Store Methods
// -------------------------------------------------------------



export async function getProducts(filters = {}, signal) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.minPrice !== "" && filters.minPrice != null) {
    params.set("min_price", filters.minPrice);
  }

  if (filters.maxPrice !== "" && filters.maxPrice != null) {
    params.set("max_price", filters.maxPrice);
  }

  if (filters.available) {
    params.set("available", "true");
  }

  params.set("page", String(filters.page || 1));
  params.set("limit", String(filters.limit || 20));

  const query = params.toString();

  const res = await fetch(
    `${API_BASE_URL}/api/products${query ? `?${query}` : ""}`,
    {
      cache: "no-store",
      signal,
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }

  return await res.json();
}

export async function getWishlist() {
  const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    throw new Error("Failed to fetch wishlist");
  }

  return response.json();
}

export async function removeFromWishlist(itemId) {
  const response = await fetch(
    `${API_BASE_URL}/api/wishlist/items/${itemId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

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

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    throw new Error("Failed to fetch current user");
  }

  return response.json();
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || "Invalid credentials");
  }

  if (data?.token) {
    setAuthToken(data.token);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(
      "mavidhai_user",
      JSON.stringify(data?.user || data)
    );
  }

  return data;
}

// -------------------------------------------------------------
// Convenience API methods
// -------------------------------------------------------------

export const get = api.get;
export const post = api.post;
export const put = api.put;
export const patch = api.patch;
export const del = api.delete;