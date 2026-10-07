import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type WardrobeItem = {
  id: string;
  name?: string;
  garment?: Record<string, unknown>;
  wearing_intents?: Array<Record<string, unknown>>;
  images?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

function getWorkspace() {
  return (
    process.env.APARNA_WORKSPACE ||
    path.resolve(process.cwd(), "..")
  );
}

function getWardrobeFile() {
  return path.join(
    getWorkspace(),
    "data",
    "wardrobe.json"
  );
}

function addImageUrls(item: WardrobeItem) {
  const images = Array.isArray(item.images)
    ? item.images
    : [];

  return {
    ...item,
    images: images.map((image) => {
      const imageId =
        typeof image.id === "string"
          ? image.id
          : undefined;

      if (!imageId) {
        return image;
      }

      return {
        ...image,
        url: `/api/wardrobe/${encodeURIComponent(
          item.id
        )}/image?image=${encodeURIComponent(imageId)}`,
      };
    }),
  };
}

export async function GET() {
  try {
    const raw = await fs.readFile(
      getWardrobeFile(),
      "utf8"
    );

    const wardrobe = JSON.parse(raw);

    const items = Array.isArray(wardrobe.items)
      ? wardrobe.items
      : [];

    return NextResponse.json({
      items: items.map(addImageUrls),
    });
  } catch (error) {
    console.error("WARDROBE GET ERROR", error);

    return NextResponse.json(
      {
        items: [],
        error: "Unable to load wardrobe.",
      },
      { status: 500 }
    );
  }
}