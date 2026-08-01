export const TRANSFORMATION_AREAS = {
  "Spiritual Growth": {
    color: "#D97706",
    softColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  "Personal Development": {
    color: "#2563EB",
    softColor: "#DBEAFE",
    borderColor: "#93C5FD",
  },
  "Leadership Excellence": {
    color: "#4338CA",
    softColor: "#E0E7FF",
    borderColor: "#A5B4FC",
  },
  Relationship: {
    color: "#E11D48",
    softColor: "#FFE4E6",
    borderColor: "#FDA4AF",
  },
  "Community Impact": {
    color: "#059669",
    softColor: "#D1FAE5",
    borderColor: "#6EE7B7",
  },
} as const;

export type TransformationArea = keyof typeof TRANSFORMATION_AREAS;

export function normalizeTransformationArea(value: unknown): string {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.includes("spiritual")) return "Spiritual Growth";
  if (raw.includes("personal")) return "Personal Development";
  if (raw.includes("leadership") || raw.includes("professional") || raw.includes("profesional")) {
    return "Leadership Excellence";
  }
  if (raw.includes("relationship") || raw.includes("family")) return "Relationship";
  if (raw.includes("community") || raw.includes("dampak")) return "Community Impact";
  return String(value || "").trim();
}

export function getTransformationAreaColor(value: unknown): string {
  const area = normalizeTransformationArea(value) as TransformationArea;
  return TRANSFORMATION_AREAS[area]?.color || "#64748B";
}

export function getTransformationAreaStyle(value: unknown) {
  const area = normalizeTransformationArea(value) as TransformationArea;
  return TRANSFORMATION_AREAS[area] || {
    color: "#64748B",
    softColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  };
}
