type JourneyIconName =
  | "reflection"
  | "direction"
  | "growth"
  | "commitment"
  | "companions"
  | "insight"
  | "lantern"
  | "professional";

export function JourneyIcon({
  name,
  className = "size-14",
}: {
  name: JourneyIconName;
  className?: string;
}) {
  return (
    <img
      src={`/landing/slj/icon-${name}.webp`}
      alt=""
      aria-hidden="true"
      width="256"
      height="256"
      loading="lazy"
      decoding="async"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
