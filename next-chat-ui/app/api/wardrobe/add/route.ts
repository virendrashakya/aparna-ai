import { NextResponse } from "next/server";
import { saveWardrobeItem } from "@/lib/wardrobe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const product = body?.product;

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

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

    if (!name) {
      return NextResponse.json(
        {
          error: "Wardrobe item name is required.",
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error:
            "Wardrobe item name must be 100 characters or less.",
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
      imageTags,
      name
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
          error instanceof Error
            ? error.message
            : "Unable to add wardrobe item.",
      },
      { status: 500 }
    );
  }
}