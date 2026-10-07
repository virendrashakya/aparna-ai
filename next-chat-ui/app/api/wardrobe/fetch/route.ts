import { NextResponse } from "next/server";
import { fetchProduct } from "@/lib/wardrobe";

export const runtime = "nodejs";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const url =
      typeof body?.url === "string"
        ? body.url.trim()
        : "";

    if (!url) {
      return NextResponse.json(
        {
          error:
            "Product URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    const product =
      await fetchProduct(url);

    return NextResponse.json({
      status: "preview",
      product,
    });
  } catch (error: unknown) {
    console.error(
      "WARDROBE FETCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch product.",
      },
      {
        status: 500,
      }
    );
  }
}
