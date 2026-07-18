import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import {
  driverExists,
  setDriverPinHash,
} from "@/lib/services/kierowcy.service";
import {
  badRequest,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/utils/api-response";
import { validatePin } from "@/lib/validators/kierowca";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return unauthorized();
    }

    const body = await request.json();
    const kierowcaId =
      typeof body === "object" && body !== null && typeof body.kierowcaId === "string"
        ? body.kierowcaId.trim()
        : "";

    if (!kierowcaId) {
      return badRequest("Brak ID kierowcy.");
    }

    const pin = validatePin(
      typeof body === "object" && body !== null && typeof body.pin === "string"
        ? body.pin.trim()
        : ""
    );

    if (!(await driverExists(kierowcaId))) {
      return notFound("Nie znaleziono kierowcy.");
    }

    const pinHash = await bcrypt.hash(pin, 12);
    await setDriverPinHash(kierowcaId, pinHash);

    return ok({ message: "PIN został zapisany." });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("PIN musi")) {
      return badRequest(error.message);
    }

    console.error("Błąd zapisywania PIN-u kierowcy:", error);
    return serverError("Nie udało się zapisać PIN-u.");
  }
}
