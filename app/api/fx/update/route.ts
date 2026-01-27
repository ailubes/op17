import { NextResponse } from "next/server";
import { fetchEcbRates, upsertFxRates } from "@/lib/fx";

const isAuthorized = (request: Request) => {
  const secret = process.env.FX_UPDATE_SECRET;
  if (!secret) {
    return true;
  }

  const header = request.headers.get("x-fx-secret");
  return header === secret;
};

export const POST = async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await fetchEcbRates();
    const results = await upsertFxRates(payload);

    return NextResponse.json({
      ok: true,
      asOf: payload.asOf.toISOString().slice(0, 10),
      updated: results.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};

