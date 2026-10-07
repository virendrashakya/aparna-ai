import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function getWorkspace() {
  return (
    process.env.APARNA_WORKSPACE ||
    path.resolve(process.cwd(), "..")
  );
}

function isInsideDirectory(
  filePath: string,
  directory: string
) {
  const relative = path.relative(
    directory,
    filePath
  );

  return (
    relative !== "" &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const imageId =
      request.nextUrl.searchParams.get("image");

    if (!imageId) {
      return NextResponse.json(
        { error: "Missing image parameter." },
        { status: 400 }
      );
    }

    const workspace = getWorkspace();
    const wardrobeDirectory = path.resolve(
      workspace,
      "wardrobe"
    );

    const itemDirectory = path.resolve(
      wardrobeDirectory,
      id
    );

    if (
      !isInsideDirectory(
        itemDirectory,
        wardrobeDirectory
      )
    ) {
      return NextResponse.json(
        { error: "Invalid wardrobe item." },
        { status: 400 }
      );
    }

    const wardrobeFile = path.join(
      workspace,
      "data",
      "wardrobe.json"
    );

    const raw = await fs.readFile(
      wardrobeFile,
      "utf8"
    );

    const wardrobe = JSON.parse(raw);

    const items = Array.isArray(wardrobe.items)
      ? wardrobe.items
      : [];

    const item = items.find(
      (entry: { id?: string }) =>
        entry?.id === id
    );

    if (!item) {
      return NextResponse.json(
        { error: "Wardrobe item not found." },
        { status: 404 }
      );
    }

    const images = Array.isArray(item.images)
      ? item.images
      : [];

    const image = images.find(
      (entry: { id?: string }) =>
        entry?.id === imageId
    );

    if (!image) {
      return NextResponse.json(
        { error: "Wardrobe image not found." },
        { status: 404 }
      );
    }

    const localPath =
      typeof image.local_path === "string"
        ? image.local_path
        : typeof image.reference_image === "string"
          ? image.reference_image
          : null;

    if (!localPath) {
      return NextResponse.json(
        { error: "Image has no local path." },
        { status: 404 }
      );
    }

    const relativePath = localPath
      .replace(/^\/+/, "")
      .replace(/^wardrobe[\\/]/, "");

    const imagePath = path.resolve(
      wardrobeDirectory,
      relativePath
    );

    if (
      !isInsideDirectory(
        imagePath,
        wardrobeDirectory
      )
    ) {
      return NextResponse.json(
        { error: "Invalid image path." },
        { status: 400 }
      );
    }

    const extension =
      path.extname(imagePath).toLowerCase();

    const contentType = MIME_TYPES[extension];

    if (!contentType) {
      return NextResponse.json(
        { error: "Unsupported image type." },
        { status: 415 }
      );
    }

    const file = await fs.readFile(imagePath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error(
      "WARDROBE IMAGE GET ERROR",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load wardrobe image.",
      },
      { status: 500 }
    );
  }
}