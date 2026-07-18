import { apiFetch } from "./fetcher";
import type { Kierowca } from "@/types/kierowca";

export interface DriverPayload {
  imie: string;
  telefon?: string;
  aktywny: boolean;
}

export async function getDrivers(): Promise<{
  success: true;
  kierowcy: Kierowca[];
}> {
  return apiFetch<{
    success: true;
    kierowcy: Kierowca[];
  }>("/api/admin/kierowcy");
}

export async function createDriver(
  data: DriverPayload
): Promise<{
  success: true;
  kierowca: Kierowca;
}> {
  return apiFetch<{
    success: true;
    kierowca: Kierowca;
  }>(
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
): Promise<{
  success: true;
  kierowca: Kierowca;
}> {
  return apiFetch<{
    success: true;
    kierowca: Kierowca;
  }>(
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
): Promise<{
  success: true;
  message: string;
}> {
  return apiFetch<{
    success: true;
    message: string;
  }>(
    "/api/admin/kierowcy",
    {
      method: "DELETE",
      body: JSON.stringify({
        id,
      }),
    }
  );
}
