import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const workspace =
      process.env.APARNA_WORKSPACE ||
      path.resolve(
        process.cwd(),
        ".."
      );

    const wardrobeFile =
      path.join(
        workspace,
        "data",
        "wardrobe.json"
      );

    const raw =
      await fs.readFile(
        wardrobeFile,
        "utf8"
      );

    const wardrobe =
      JSON.parse(raw);

    return NextResponse.json({
      items:
        Array.isArray(
          wardrobe.items
        )
          ? wardrobe.items
          : [],
    });
  } catch (error) {
    console.error(
      "WARDROBE LIST ERROR",
      error
    );

    return NextResponse.json(
      {
        items: [],
        error:
          "Unable to load wardrobe.",
      },
      {
        status: 500,
      }
    );
  }
}