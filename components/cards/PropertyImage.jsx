// Uses Unsplash source for free placeholder images. No API key needed.
export default function PropertyImage({ query, alt, className = "" }) {
  const url = `https://source.unsplash.com/600x400/?${encodeURIComponent(query || "real estate")}`;
  return (
    <img
      src={url} alt={alt || query} loading="lazy"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}