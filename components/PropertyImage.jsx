import { useEffect, useState } from "react";
import dummyImg from "../../images/dummyImage.webp";
import { resolveImageUrl } from "../lib/api.js";
import "./PropertyImage.css";

const imageCache = new Map();

export function resolveFirstPhoto(photos) {
  if (!photos) return null;
  const list = Array.isArray(photos)
    ? photos
    : typeof photos === "string" && photos.trim()
      ? [photos.trim()]
      : [];
  for (const raw of list) {
    const url = resolveImageUrl(raw);
    if (url) return url;
  }
  return null;
}

export function getCachedPropertyImage(propertyId) {
  if (!propertyId) return null;
  return imageCache.get(String(propertyId)) || null;
}

/**
 * Stable property thumbnail — never flashes dummy once a real image URL is known.
 * Uses a per-property cache so parent re-renders (chat stream, search typing) do not reset src.
 */
export default function PropertyImage({
  propertyId,
  photos,
  alt = "",
  className = "",
  loading = "lazy",
}) {
  const id = propertyId ? String(propertyId) : "";
  const resolved = resolveFirstPhoto(photos);
  const cached = id ? imageCache.get(id) : null;
  const initialUrl = cached || resolved || null;

  const [src, setSrc] = useState(initialUrl);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const next = resolveFirstPhoto(photos);
    if (!next) return;
    if (id) imageCache.set(id, next);
    setSrc((prev) => {
      if (id && imageCache.has(id)) return imageCache.get(id);
      if (prev) return prev;
      return next;
    });
    setErrored(false);
  }, [id, resolved]);

  if (!src && !errored) {
    return <div className={`property-image-skeleton ${className}`.trim()} aria-label={alt} role="img" />;
  }

  return (
    <img
      src={errored ? dummyImg : src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onLoad={() => {
        if (id && src && !errored) imageCache.set(id, src);
      }}
      onError={() => {
        if (id && imageCache.has(id)) return;
        setErrored(true);
      }}
    />
  );
}
