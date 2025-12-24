// Minimal shape for JSON-LD Product schema
export interface ProductLike {
  id?: string;
  name?: string;
  description?: string;
  images?: Array<string | { url?: string; src?: string }>;
  imageUrl?: string;
  price?: number | null;
  inStock?: boolean;
  brand?: string | null;
}

function toImageUrl(
  img: string | { url?: string; src?: string } | undefined
): string | undefined {
  if (!img) return undefined;
  if (typeof img === "string") return img;
  return img.url || img.src;
}

export function ProductSchema({ product }: { product: ProductLike }) {
  if (!product || !product.name) return null;

  const images: string[] = [];
  if (Array.isArray(product.images)) {
    for (const i of product.images) {
      const url = toImageUrl(i);
      if (url) images.push(url);
    }
  }
  if (product.imageUrl && !images.length) {
    images.push(product.imageUrl);
  }

  const price = typeof product.price === "number" ? product.price : undefined;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: images.length ? images : undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    sku: product.id || undefined,
    offers:
      price !== undefined
        ? {
            "@type": "Offer",
            priceCurrency: "GBP",
            price: price,
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default ProductSchema;
