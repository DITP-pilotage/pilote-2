import type { z } from "zod";

export interface ErreurValidation {
  chemin: string;
  message: string;
}

// ["seances", 3, "motif_id"] devient "seances[3].motif_id".
function formatChemin(path: PropertyKey[]): string {
  return path.reduce<string>((chemin, segment) => {
    if (typeof segment === "number") return `${chemin}[${segment}]`;
    return chemin ? `${chemin}.${String(segment)}` : String(segment);
  }, "");
}

export function formatValidationErrors(error: z.ZodError): ErreurValidation[] {
  return error.issues.map((issue) => ({
    chemin: formatChemin(issue.path),
    message: issue.message,
  }));
}
