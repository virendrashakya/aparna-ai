import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const WORKSPACE =
  process.env.APARNA_WORKSPACE ||
  path.resolve(process.cwd(), "..");

const WARDROBE_FILE = path.join(
  WORKSPACE,
  "data",
  "wardrobe.json"
);

const WARDROBE_DIRECTORY = path.join(
  WORKSPACE,
  "wardrobe"
);

const ALLOWED_RETAILERS = [
  "myntra.com",
  "ajio.com",
  "flipkart.com",
  "meesho.com",
];

type ProductImage = {
  id: string;
  url: string;
};

export type WardrobeProduct = {
  retailer: string | null;
  productId: string | null;
  productUrl: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  color: string | null;
  fit: string | null;
  length: string | null;
  details: string[];
  images: ProductImage[];
};

type ImageTag = {
  id: string;
  url: string;
  tags: string[];
};

function createId() {
  return crypto.randomUUID();
}

function slugify(value: string) {
  return String(value || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned =
    value
      .replace(/\s+/g, " ")
      .trim();

  return cleaned || null;
}

function getExtension(
  filename: string
) {
  const extension =
    path.extname(filename);

  if (
    [".jpg", ".jpeg", ".png", ".webp"].includes(
      extension.toLowerCase()
    )
  ) {
    return extension.toLowerCase();
  }

  return ".jpg";
}

function detectRetailer(
  url: string
) {
  try {
    const hostname =
      new URL(url)
        .hostname
        .toLowerCase()
        .replace(/^www\./, "");

    return (
      ALLOWED_RETAILERS.find(
        (domain) =>
          hostname === domain ||
          hostname.endsWith(
            `.${domain}`
          )
      ) || null
    );
  } catch {
    return null;
  }
}

function extractMeta(
  html: string,
  property: string
) {
  const escaped =
    property.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      "\\$&"
    );

  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match =
      html.match(pattern);

    if (match?.[1]) {
      return match[1]
        .replace(/&amp;/g, "&")
        .replace(
          /&quot;/g,
          '"'
        )
        .trim();
    }
  }

  return null;
}

function extractJsonLd(
  html: string
) {
  const scripts = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  const results: unknown[] = [];

  for (const match of scripts) {
    try {
      const parsed =
        JSON.parse(
          match[1].trim()
        );

      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else {
        results.push(parsed);
      }
    } catch {
      // Ignore invalid JSON-LD.
    }
  }

  return results;
}

function findProductSchema(
  value: unknown
): any | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result =
        findProductSchema(item);

      if (result) {
        return result;
      }
    }

    return null;
  }

  if (
    typeof value !== "object"
  ) {
    return null;
  }

  const object =
    value as Record<
      string,
      any
    >;

  const type =
    object["@type"];

  if (
    type === "Product" ||
    (Array.isArray(type) &&
      type.includes("Product"))
  ) {
    return object;
  }

  if (object["@graph"]) {
    return findProductSchema(
      object["@graph"]
    );
  }

  return null;
}

function absoluteUrl(
  value: string | null,
  baseUrl: string
) {
  if (!value) {
    return null;
  }

  try {
    return new URL(
      value,
      baseUrl
    ).toString();
  } catch {
    return null;
  }
}

function extractImages(
  html: string,
  schema: any,
  productUrl: string
) {
  const images: string[] = [];

  const addImage = (
    value: unknown
  ) => {
    if (
      typeof value !== "string"
    ) {
      return;
    }

    const absolute =
      absoluteUrl(
        value,
        productUrl
      );

    if (
      absolute &&
      !images.includes(
        absolute
      )
    ) {
      images.push(absolute);
    }
  };

  const schemaImages =
    schema?.image;

  if (Array.isArray(schemaImages)) {
    schemaImages.forEach(
      addImage
    );
  } else {
    addImage(schemaImages);
  }

  const imageRegex =
    /https?:\/\/[^"'<>\\\s]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\\\s]*)?/gi;

  const matches =
    html.match(imageRegex) || [];

  matches.forEach(
    addImage
  );

  return images.slice(
    0,
    8
  );
}

function inferCategory(
  product: any,
  name: string | null
) {
  const value =
    `${product?.category || ""} ${
      name || ""
    }`.toLowerCase();

  if (
    value.includes("dress")
  ) {
    return "dress";
  }

  if (
    value.includes("saree")
  ) {
    return "saree";
  }

  if (
    value.includes("blouse")
  ) {
    return "blouse";
  }

  if (
    value.includes("top")
  ) {
    return "top";
  }

  if (
    value.includes("shirt")
  ) {
    return "shirt";
  }

  if (
    value.includes("skirt")
  ) {
    return "skirt";
  }

  if (
    value.includes("jeans") ||
    value.includes("trouser") ||
    value.includes("pants")
  ) {
    return "bottom";
  }

  return "clothing";
}

export async function fetchProduct(
  productUrl: string
): Promise<WardrobeProduct> {
  let parsedUrl: URL;

  try {
    parsedUrl =
      new URL(productUrl);
  } catch {
    throw new Error(
      "Invalid product URL."
    );
  }

  if (
    parsedUrl.protocol !==
    "https:"
  ) {
    throw new Error(
      "Only HTTPS product URLs are supported."
    );
  }

  const retailer =
    detectRetailer(
      productUrl
    );

  if (!retailer) {
    throw new Error(
      "Supported retailers are Myntra, AJIO, Flipkart and Meesho."
    );
  }

  const response =
    await fetch(
      productUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/153 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language":
            "en-US,en;q=0.9",
        },
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch product page (${response.status}).`
    );
  }

  const html =
    await response.text();

  const jsonLd =
    extractJsonLd(html);

  const schema =
    jsonLd
      .map(
        findProductSchema
      )
      .find(Boolean);

  const name =
    cleanText(schema?.name) ||
    cleanText(
      extractMeta(
        html,
        "og:title"
      )
    ) ||
    cleanText(
      extractMeta(
        html,
        "twitter:title"
      )
    );

  const brand =
    cleanText(
      typeof schema?.brand ===
        "string"
        ? schema.brand
        : schema?.brand?.name
    );

  const images =
    extractImages(
      html,
      schema,
      productUrl
    );

  if (!images.length) {
    throw new Error(
      "No product images could be found on this page."
    );
  }

  const productId =
    cleanText(schema?.sku) ||
    cleanText(
      schema?.productID
    );

  return {
    retailer,
    productId,
    productUrl,
    name,
    brand,
    category:
      inferCategory(
        schema,
        name
      ),
    color:
      cleanText(
        schema?.color
      ),
    fit: null,
    length: null,
    details: [],
    images:
      images.map(
        (url, index) => ({
          id:
            `image_${index + 1}`,
          url,
        })
      ),
  };
}

function getTagFilename(
  tags: string[]
) {
  const priority = [
    "front",
    "back",
    "side",
    "closeup_front",
    "closeup_back",
    "closeup_side",
    "dress_only",
  ];

  return (
    priority.find(
      (tag) =>
        tags.includes(tag)
    ) || null
  );
}

async function downloadImage(
  url: string,
  destination: string
) {
  const response =
    await fetch(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/153 Safari/537.36",
          Accept:
            "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `Unable to download image: ${response.status}`
    );
  }

  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    );

  await fs.writeFile(
    destination,
    buffer
  );
}

export async function saveWardrobeItem(
  product: WardrobeProduct,
  imageTags: ImageTag[],
  customName: string
) {
  const wardrobeName =
    customName.trim();

  if (!wardrobeName) {
    throw new Error(
      "Wardrobe item name is required."
    );
  }

  if (
    wardrobeName.length > 100
  ) {
    throw new Error(
      "Wardrobe item name must be 100 characters or less."
    );
  }

  await fs.mkdir(
    WARDROBE_DIRECTORY,
    {
      recursive: true,
    }
  );

  const itemId =
    `${slugify(
      wardrobeName
    )}_${createId().slice(0, 8)}`;

  const itemDirectory =
    path.join(
      WARDROBE_DIRECTORY,
      itemId
    );

  await fs.mkdir(
    itemDirectory,
    {
      recursive: true,
    }
  );

  const visualReference:
    Record<
      string,
      string | null
    > = {
      front: null,
      back: null,
      side: null,
      closeup_front: null,
      closeup_back: null,
      closeup_side: null,
      dress_only: null,
    };

  const savedImages: any[] =
    [];

  for (
    let index = 0;
    index < imageTags.length;
    index++
  ) {
    const image =
      imageTags[index];

    if (!image?.url) {
      continue;
    }

    const extension =
      getExtension(
        image.url
      );

    const tags =
      Array.isArray(
        image.tags
      )
        ? image.tags
        : [];

    const primaryTag =
      getTagFilename(
        tags
      );

    const filename =
      primaryTag
        ? `${primaryTag}${extension}`
        : `image_${index + 1}${extension}`;

    const destination =
      path.join(
        itemDirectory,
        filename
      );

    try {
      await downloadImage(
        image.url,
        destination
      );

      const relativePath =
        path
          .relative(
            WORKSPACE,
            destination
          )
          .split(
            path.sep
          )
          .join("/");

      savedImages.push({
        id:
          image.id ||
          `image_${index + 1}`,
        source_url:
          image.url,
        local_path:
          relativePath,
        tags,
      });

      for (const tag of tags) {
        if (
          Object.prototype.hasOwnProperty.call(
            visualReference,
            tag
          )
        ) {
          visualReference[tag] =
            relativePath;
        }
      }
    } catch (error) {
      console.error(
        `Failed to download ${image.url}`,
        error
      );
    }
  }

  if (!savedImages.length) {
    throw new Error(
      "None of the product images could be downloaded."
    );
  }

  const wardrobeItem = {
    id: itemId,
    name: wardrobeName,

    source: {
      type: "retailer",
      retailer:
        product.retailer ||
        null,
      product_id:
        product.productId ||
        null,
      url:
        product.productUrl ||
        null,
    },

    garment: {
      name: wardrobeName,
      original_name:
        product.name ||
        null,
      brand:
        product.brand ||
        null,
      category:
        product.category ||
        "clothing",
      color:
        product.color ||
        null,
      fit:
        product.fit ||
        null,
      length:
        product.length ||
        null,
      details:
        Array.isArray(
          product.details
        )
          ? product.details
          : [],
    },

    wearing_intents: [],

    visual_reference:
      visualReference,

    images:
      savedImages,

    aparna: {
      status: "available",
      public_content: true,
    },

    usage: {
      times_worn: 0,
      times_posted: 0,
      last_worn: null,
      last_posted: null,
    },

    created_at:
      new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(
      itemDirectory,
      "item.json"
    ),
    JSON.stringify(
      wardrobeItem,
      null,
      2
    ),
    "utf8"
  );

  return appendWardrobeItem(
    wardrobeItem
  );
}

export async function saveUploadedWardrobeItem(
  customName: string,
  upload: {
    id: string;
    local_path: string;
    filename: string;
    mime_type?: string;
    size?: number;
  },
  analysis: any
) {
  const wardrobeName =
    customName.trim();

  if (!wardrobeName) {
    throw new Error(
      "Wardrobe item name is required."
    );
  }

  if (
    wardrobeName.length > 100
  ) {
    throw new Error(
      "Wardrobe item name must be 100 characters or less."
    );
  }

  const sourcePath =
    path.resolve(
      WORKSPACE,
      upload.local_path
    );

  const uploadDirectory =
    path.resolve(
      WORKSPACE,
      "wardrobe",
      "_uploads"
    );

  const relativeUploadDirectory =
    `${uploadDirectory}${path.sep}`;

  if (
    !sourcePath.startsWith(
      relativeUploadDirectory
    )
  ) {
    throw new Error(
      "Invalid wardrobe upload reference."
    );
  }

  try {
    await fs.access(
      sourcePath
    );
  } catch {
    throw new Error(
      "The uploaded wardrobe reference could not be found."
    );
  }

  const itemId =
    `${slugify(
      wardrobeName
    )}_${createId().slice(0, 8)}`;

  const itemDirectory =
    path.join(
      WARDROBE_DIRECTORY,
      itemId
    );

  const sourceDirectory =
    path.join(
      itemDirectory,
      "source"
    );

  await fs.mkdir(
    sourceDirectory,
    {
      recursive: true,
    }
  );

  const extension =
    getExtension(
      upload.filename
    );

  const sourceDestination =
    path.join(
      sourceDirectory,
      `reference${extension}`
    );

  await fs.copyFile(
    sourcePath,
    sourceDestination
  );

  const sourceRelativePath =
    path
      .relative(
        WORKSPACE,
        sourceDestination
      )
      .split(
        path.sep
      )
      .join("/");

  const garment =
    analysis?.garment || {};

  const wearingIntent =
    analysis?.wearing_intent ||
    {};

  const item = {
    id: itemId,

    name: wardrobeName,

    source: {
      type: "uploaded_photo",
      upload_id:
        upload.id,
      original_filename:
        upload.filename ||
        null,
      mime_type:
        upload.mime_type ||
        null,
    },

    garment: {
      name:
        garment.name ||
        wardrobeName,

      type:
        garment.type ||
        "clothing",

      subtype:
        garment.subtype ||
        null,

      color:
        garment.color ||
        null,

      secondary_colors:
        Array.isArray(
          garment.secondary_colors
        )
          ? garment.secondary_colors
          : [],

      material:
        garment.material ||
        null,

      pattern:
        garment.pattern ||
        null,

      construction:
        Array.isArray(
          garment.construction
        )
          ? garment.construction
          : [],

      fit:
        garment.fit ||
        null,

      length:
        garment.length ||
        null,

      neckline:
        garment.neckline ||
        null,

      sleeves:
        garment.sleeves ||
        null,

      straps:
        garment.straps ||
        null,

      details:
        Array.isArray(
          garment.details
        )
          ? garment.details
          : [],
    },

    wearing_intents: [
      {
        id: "reference_01",

        name:
          wearingIntent.name ||
          "Reference styling",

        description:
          wearingIntent.description ||
          null,

        waist_position:
          wearingIntent.waist_position ||
          null,

        garment_position:
          wearingIntent.garment_position ||
          null,

        fit:
          wearingIntent.fit ||
          null,

        silhouette:
          wearingIntent.silhouette ||
          null,

        neckline_position:
          wearingIntent.neckline_position ||
          null,

        sleeve_position:
          wearingIntent.sleeve_position ||
          null,

        tuck:
          wearingIntent.tuck ||
          null,

        drape:
          wearingIntent.drape ||
          null,

        layering:
          wearingIntent.layering ||
          null,

        fastening:
          wearingIntent.fastening ||
          null,

        exposure_intent:
          wearingIntent.exposure_intent ||
          null,

        preserve:
          Array.isArray(
            wearingIntent.preserve
          )
            ? wearingIntent.preserve
            : [],

        constraints:
          Array.isArray(
            wearingIntent.constraints
          )
            ? wearingIntent.constraints
            : [],

        accessories:
          Array.isArray(
            wearingIntent.accessories
          )
            ? wearingIntent.accessories
            : [],

        reference_image:
          sourceRelativePath,
      },
    ],

    visual_reference: {
      source:
        sourceRelativePath,
    },

    images: [
      {
        id: "reference_01",
        local_path:
          sourceRelativePath,
        role:
          "wearing_and_garment_reference",
      },
    ],

    analysis: {
      confidence:
        typeof analysis?.confidence ===
        "number"
          ? analysis.confidence
          : null,

      notes:
        Array.isArray(
          analysis?.notes
        )
          ? analysis.notes
          : [],
    },

    aparna: {
      status: "available",
      public_content: true,
    },

    usage: {
      times_worn: 0,
      times_posted: 0,
      last_worn: null,
      last_posted: null,
    },

    created_at:
      new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(
      itemDirectory,
      "item.json"
    ),
    JSON.stringify(
      item,
      null,
      2
    ),
    "utf8"
  );

  await appendWardrobeItem(
    item
  );

  // The temporary upload is no longer needed.
  try {
    await fs.unlink(
      sourcePath
    );
  } catch {
    // Ignore cleanup failure.
  }

  return item;
}

async function appendWardrobeItem(
  item: any
) {
  let wardrobe: any = {
    items: [],
  };

  try {
    const existing =
      await fs.readFile(
        WARDROBE_FILE,
        "utf8"
      );

    wardrobe =
      JSON.parse(
        existing
      );

    if (
      !Array.isArray(
        wardrobe.items
      )
    ) {
      wardrobe.items = [];
    }
  } catch {
    wardrobe = {
      items: [],
    };
  }

  wardrobe.items.push(
    item
  );

  await fs.mkdir(
    path.dirname(
      WARDROBE_FILE
    ),
    {
      recursive: true,
    }
  );

  await fs.writeFile(
    WARDROBE_FILE,
    JSON.stringify(
      wardrobe,
      null,
      2
    ),
    "utf8"
  );

  return item;
}