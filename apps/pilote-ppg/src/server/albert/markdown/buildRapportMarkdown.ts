import { RapportInput } from "@/server/albert/rapportInput";

function escapeTableCell(text: string): string {
  return text.replace(/\|/g, "\\|");
}

export function buildRapportMarkdown(input: RapportInput): string {
  const lines: string[] = [];

  lines.push(`# ${input.titre}`);
  lines.push("");
  lines.push(`*${input.date}*`);
  lines.push("");
  lines.push(`> ${input.resume}`);
  lines.push("");

  for (const section of input.sections) {
    lines.push(`## ${section.titre}`);
    lines.push("");

    for (const partie of section.parties) {
      if (partie.type === "paragraphe") {
        lines.push(partie.contenu);
        lines.push("");
      }

      if (partie.type === "tableau") {
        lines.push(`| ${partie.en_tetes.map(escapeTableCell).join(" | ")} |`);
        lines.push(`| ${partie.en_tetes.map(() => "---").join(" | ")} |`);
        for (const ligne of partie.lignes) {
          lines.push(`| ${ligne.map(escapeTableCell).join(" | ")} |`);
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}
