const API_BASE = "/api";

export async function fetchSales(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const url = `${API_BASE}/sales?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sales: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchSummary(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const url = `${API_BASE}/sales/summary?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchFilters() {
  const response = await fetch(`${API_BASE}/sales/filters`);

  if (!response.ok) {
    throw new Error(`Failed to fetch filters: ${response.statusText}`);
  }

  return response.json();
}

export async function exportSales(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const url = `${API_BASE}/sales/export?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to export sales: ${response.statusText}`);
  }

  return response;
}
