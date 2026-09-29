import { NextResponse } from "next/server";
import { saveWardrobeItem } from "@/lib/wardrobe";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();

    const product = body?.product;
    const imageTags = Array.isArray(body?.imageTags)
      ? body.imageTags
      : [];

    if (!product) {
      return NextResponse.json(
        {
          error: "Product information is required.",
        },
        { status: 400 }
      );
    }

    if (!product.productUrl) {
      return NextResponse.json(
        {
          error: "Product URL is required.",
        },
        { status: 400 }
      );
    }

    if (!imageTags.length) {
      return NextResponse.json(
        {
          error: "At least one product image is required.",
        },
        { status: 400 }
      );
    }

    const item = await saveWardrobeItem(
      product,
      imageTags
    );

    return NextResponse.json({
      status: "added",
      item,
    });
  } catch (error) {
    console.error(
      "WARDROBE ADD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to add wardrobe item.",
      },
      { status: 500 }
    );
  }
}