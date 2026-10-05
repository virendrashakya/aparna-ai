import { NextResponse } from "next/server";
import {
  saveUploadedWardrobeItem,
} from "@/lib/wardrobe";

export const runtime = "nodejs";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    const upload =
      body?.upload;

    const analysis =
      body?.analysis;

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Wardrobe item name is required.",
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

    if (
      !upload ||
      typeof upload.id !== "string" ||
      typeof upload.local_path !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Uploaded wardrobe reference is required.",
        },
        { status: 400 }
      );
    }

    if (
      !analysis ||
      typeof analysis !== "object"
    ) {
      return NextResponse.json(
        {
          error:
            "Garment analysis is required.",
        },
        { status: 400 }
      );
    }

    const item =
      await saveUploadedWardrobeItem(
        name,
        upload,
        analysis
      );

    return NextResponse.json({
      status: "added",
      item,
    });
  } catch (error) {
    console.error(
      "WARDROBE UPLOAD ADD ERROR:",
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