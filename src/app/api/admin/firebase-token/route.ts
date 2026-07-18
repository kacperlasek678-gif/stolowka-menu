import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { serverError, unauthorized } from "@/lib/utils/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return unauthorized();
    }

    // Firebase Admin is loaded only after verifying the admin session. This
    // keeps an invalid credential from crashing the whole endpoint module.
    const [
      { getAuth },
      { getFirebaseAdminApp },
    ] = await Promise.all([
      import("firebase-admin/auth"),
      import("@/lib/firebase-admin"),
    ]);

    const token = await getAuth(
      getFirebaseAdminApp()
    ).createCustomToken("jak-u-mamy-admin", {
      role: "admin",
    });

    return Response.json({ success: true, token });
  } catch (error) {
    console.error("Nie udało się utworzyć tokenu Firebase administratora:", error);
    return serverError("Nie udało się przygotować dostępu do danych.");
  }
}
