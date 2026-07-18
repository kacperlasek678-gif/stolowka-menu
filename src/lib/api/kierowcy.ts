import { apiFetch } from "./fetcher";

export interface DriverPayload {
  imie: string;
  telefon?: string;
  aktywny: boolean;
}

export async function getDrivers() {
  return apiFetch<{
    success: boolean;
    kierowcy: any[];
  }>("/api/admin/kierowcy");
}

export async function createDriver(
  data: DriverPayload
) {
  return apiFetch(
    "/api/admin/kierowcy",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function updateDriver(
  id: string,
  data: DriverPayload
) {
  return apiFetch(
    "/api/admin/kierowcy",
    {
      method: "PATCH",
      body: JSON.stringify({
        id,
        ...data,
      }),
    }
  );
}

export async function deleteDriver(
  id: string
) {
  return apiFetch(
    "/api/admin/kierowcy",
    {
      method: "DELETE",
      body: JSON.stringify({
        id,
      }),
    }
  );
}