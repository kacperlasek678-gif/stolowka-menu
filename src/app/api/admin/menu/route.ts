import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import {
  createMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  menuItemExists,
  updateMenuItem,
  type MenuItemInput,
} from "@/lib/services/menu.service";
import {
  badRequest,
  created,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/utils/api-response";

export const runtime = "nodejs";

const CATEGORIES = new Set(["Zupy", "Dania główne", "Dodatki", "Napoje", "Desery"]);

class ValidationError extends Error {}

function readInput(body: unknown): MenuItemInput {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("Nieprawidłowe dane dania.");
  }

  const data = body as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const price = data.price;
  const category = typeof data.category === "string" ? data.category.trim() : "";

  if (!name || name.length > 120) {
    throw new ValidationError("Podaj nazwę dania (maksymalnie 120 znaków).");
  }

  if (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 10000) {
    throw new ValidationError("Podaj prawidłową cenę dania.");
  }

  if (!CATEGORIES.has(category)) {
    throw new ValidationError("Wybierz prawidłową kategorię.");
  }

  return {
    name,
    price: Math.round(price * 100) / 100,
    category,
    available: typeof data.available === "boolean" ? data.available : true,
  };
}

function readId(body: unknown) {
  if (typeof body !== "object" || body === null) {
    return "";
  }

  const data = body as Record<string, unknown>;
  return typeof data.id === "string" ? data.id.trim() : "";
}

async function authorised(request: NextRequest) {
  return Boolean(await requireAdmin(request));
}

function errorResponse(error: unknown, message: string) {
  console.error(message, error);
  return error instanceof ValidationError ? badRequest(error.message) : serverError(message);
}

export async function GET(request: NextRequest) {
  try {
    if (!(await authorised(request))) return unauthorized();
    const response = ok({ items: await getAllMenuItems() });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    return errorResponse(error, "Nie udało się pobrać menu.");
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await authorised(request))) return unauthorized();
    return created({ item: await createMenuItem(readInput(await request.json())) });
  } catch (error) {
    return errorResponse(error, "Nie udało się dodać dania.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await authorised(request))) return unauthorized();
    const body = await request.json();
    const id = readId(body);
    if (!id) return badRequest("Brakuje identyfikatora dania.");
    if (!(await menuItemExists(id))) return notFound("Danie nie istnieje.");
    return ok({ item: await updateMenuItem(id, readInput(body)) });
  } catch (error) {
    return errorResponse(error, "Nie udało się zaktualizować dania.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await authorised(request))) return unauthorized();
    const id = readId(await request.json());
    if (!id) return badRequest("Brakuje identyfikatora dania.");
    if (!(await menuItemExists(id))) return notFound("Danie nie istnieje.");
    await deleteMenuItem(id);
    return ok({ message: "Danie zostało usunięte." });
  } catch (error) {
    return errorResponse(error, "Nie udało się usunąć dania.");
  }
}
