import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import {
  createDriver,
  deleteDriver,
  driverExists,
  getAllDrivers,
  getDriverById,
  updateDriver,
} from "@/lib/services/kierowcy.service";
import {
  badRequest,
  created,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/utils/api-response";
import { validateDriver } from "@/lib/validators/kierowca";

export const runtime = "nodejs";

type DriverInput = {
  imie: string;
  telefon: string;
  aktywny: boolean;
};

function readDriverInput(body: unknown): DriverInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("Nieprawidłowe dane kierowcy.");
  }

  const data = body as Record<string, unknown>;

  return {
    imie: validateDriver(typeof data.imie === "string" ? data.imie : ""),
    telefon: typeof data.telefon === "string" ? data.telefon.trim() : "",
    aktywny: typeof data.aktywny === "boolean" ? data.aktywny : true,
  };
}

async function isAdmin(request: NextRequest) {
  return Boolean(await requireAdmin(request));
}

function handleError(error: unknown, message: string) {
  console.error(message, error);

  if (error instanceof Error && error.message.startsWith("Podaj")) {
    return badRequest(error.message);
  }

  return serverError(message);
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorized();
    }

    const kierowcy = await getAllDrivers();
    const response = ok({ kierowcy });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    return handleError(error, "Nie udało się pobrać kierowców.");
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorized();
    }

    const input = readDriverInput(await request.json());
    const id = await createDriver(input);

    return created({
      kierowca: {
        id,
        ...input,
        pinUstawiony: false,
      },
    });
  } catch (error) {
    return handleError(error, "Nie udało się dodać kierowcy.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorized();
    }

    const body = await request.json();
    const id =
      typeof body === "object" && body !== null && typeof body.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return badRequest("Brakuje identyfikatora kierowcy.");
    }

    if (!(await driverExists(id))) {
      return notFound("Kierowca nie istnieje.");
    }

    const input = readDriverInput(body);
    await updateDriver(id, input);
    const kierowca = await getDriverById(id);

    return ok({ kierowca });
  } catch (error) {
    return handleError(error, "Nie udało się zaktualizować kierowcy.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorized();
    }

    const body = await request.json();
    const id =
      typeof body === "object" && body !== null && typeof body.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return badRequest("Brakuje identyfikatora kierowcy.");
    }

    if (!(await driverExists(id))) {
      return notFound("Kierowca nie istnieje.");
    }

    await deleteDriver(id);
    return ok({ message: "Kierowca został usunięty." });
  } catch (error) {
    return handleError(error, "Nie udało się usunąć kierowcy.");
  }
}
