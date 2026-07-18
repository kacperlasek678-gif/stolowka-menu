import { getAuth } from "firebase-admin/auth";
import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import "@/lib/firebase-admin";
import { serverError, unauthorized } from "@/lib/utils/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return unauthorized();
    }

    const token = await getAuth().createCustomToken("jak-u-mamy-admin", {
      role: "admin",
    });

    return Response.json({ success: true, token });
  } catch (error) {
    console.error("Nie udało się utworzyć tokenu Firebase administratora:", error);
    return serverError("Nie udało się przygotować dostępu do danych.");
  }
}
