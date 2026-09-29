import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_HOSTS = [
  // Myntra
  "assets.myntassets.com",
  "images.myntra.com",

  // AJIO
  "assets.ajio.com",
  "static.ajio.com",

  // Flipkart
  "rukminim1.flixcart.com",
  "rukminim2.flixcart.com",
  "rukminim3.flixcart.com",
  "rukminim4.flixcart.com",

  // Meesho
  "images.meesho.com",
];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOSTS.some(
    (host) =>
      hostname === host ||
      hostname.endsWith(`.${host}`)
  );
}

export async function GET(
  request: Request
) {
  try {
    const requestUrl =
      new URL(request.url);

    const imageUrl =
      requestUrl.searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse(
        "Image URL is required.",
        { status: 400 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl =
        new URL(imageUrl);
    } catch {
      return new NextResponse(
        "Invalid image URL.",
        { status: 400 }
      );
    }

    if (
      parsedUrl.protocol !== "https:"
    ) {
      return new NextResponse(
        "Only HTTPS images are supported.",
        { status: 400 }
      );
    }

    if (
      !isAllowedHost(
        parsedUrl.hostname
          .toLowerCase()
      )
    ) {
      return new NextResponse(
        "Image host is not allowed.",
        { status: 403 }
      );
    }

    const response =
      await fetch(
        parsedUrl.toString(),
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/153 Safari/537.36",

            Accept:
              "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",

            Referer:
              `${parsedUrl.protocol}//${parsedUrl.host}/`,
          },

          cache: "no-store",
        }
      );

    if (!response.ok) {
      return new NextResponse(
        `Unable to fetch image: ${response.status}`,
        {
          status: response.status,
        }
      );
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "image/jpeg";

    const imageBuffer =
      await response.arrayBuffer();

    return new NextResponse(
      imageBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            contentType,

          "Cache-Control":
            "public, max-age=86400, s-maxage=86400",

          "Content-Length":
            String(
              imageBuffer.byteLength
            ),
        },
      }
    );
  } catch (error) {
    console.error(
      "WARDROBE IMAGE PROXY ERROR:",
      error
    );

    return new NextResponse(
      "Unable to load image.",
      { status: 500 }
    );
  }
}