import fs from "node:fs";
import path from "node:path";

interface ServiceReferentiel {
  slug: string;
  libelle: string;
}

interface MinistereReferentiel {
  slug: string;
  libelle: string;
  services: ServiceReferentiel[];
}

interface Referentiel {
  ministeres: MinistereReferentiel[];
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanum with dashes
    .replace(/^-+|-+$/g, "") // Trim dashes
    .replace(/-+/g, "-"); // Collapse multiple dashes
}

function genererReferentiel(): void {
  const csvPath = path.join(
    process.cwd(),
    "docs/referentiel-services-pilote.csv",
  );
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  const lines = csvContent.split("\n").slice(1); // Skip header

  const ministeresMap = new Map<string, MinistereReferentiel>();

  for (const line of lines) {
    if (!line.trim()) continue;

    const [nomService, ministere] = line
      .split(";")
      .map((field) => field.trim());

    if (!ministere || !nomService) continue;

    const ministereSlug = slugify(ministere);

    if (!ministeresMap.has(ministereSlug)) {
      ministeresMap.set(ministereSlug, {
        slug: ministereSlug,
        libelle: ministere,
        services: [],
      });
    }

    const serviceSlug = slugify(nomService);
    const ministereData = ministeresMap.get(ministereSlug)!;

    // Avoid duplicates
    if (!ministereData.services.some((s) => s.slug === serviceSlug)) {
      ministereData.services.push({
        slug: serviceSlug,
        libelle: nomService,
      });
    }
  }

  // Convert to array and sort
  const ministeres = Array.from(ministeresMap.values());

  // Move "Autre" ministere to the end
  const autreIndex = ministeres.findIndex((m) => m.slug === "autre");
  if (autreIndex !== -1) {
    const [autre] = ministeres.splice(autreIndex, 1);
    ministeres.push(autre);
  }

  // For each ministere, move "Autre" service to the end
  for (const ministere of ministeres) {
    const autreServiceIndex = ministere.services.findIndex(
      (s) => s.slug === "autre",
    );
    if (autreServiceIndex !== -1) {
      const [autreService] = ministere.services.splice(autreServiceIndex, 1);
      ministere.services.push(autreService);
    }
  }

  const referentiel: Referentiel = { ministeres };

  const outputPath = path.join(
    process.cwd(),
    "src",
    "client",
    "constants",
    "referentiel-services.json",
  );

  fs.writeFileSync(outputPath, JSON.stringify(referentiel, null, 2), "utf-8");

  console.log(`✅ Référentiel généré : ${outputPath}`);
  console.log(`   ${referentiel.ministeres.length} ministères`);
  console.log(
    `   ${referentiel.ministeres.reduce((acc, m) => acc + m.services.length, 0)} services au total`,
  );
}

genererReferentiel();
