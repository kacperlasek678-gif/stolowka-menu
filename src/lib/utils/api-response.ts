import { NextResponse } from "next/server";

export function ok(data?: unknown) {
  return NextResponse.json(
    {
      success: true,
      ...(typeof data === "object" && data !== null ? data : {}),
    },
    {
      status: 200,
    }
  );
}

export function created(data?: unknown) {
  return NextResponse.json(
    {
      success: true,
      ...(typeof data === "object" && data !== null ? data : {}),
    },
    {
      status: 201,
    }
  );
}

export function badRequest(error: string) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status: 400,
    }
  );
}

export function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: "Brak autoryzacji.",
    },
    {
      status: 401,
    }
  );
}

export function forbidden() {
  return NextResponse.json(
    {
      success: false,
      error: "Brak dostępu.",
    },
    {
      status: 403,
    }
  );
}

export function notFound(error: string) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status: 404,
    }
  );
}

export function serverError(
  error = "Wystąpił błąd serwera."
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status: 500,
    }
  );
}