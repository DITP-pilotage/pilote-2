import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

interface ServiceReferentiel {
  slug: string;
  libelle: string;
}

interface PerimetreMinisterielReferentiel {
  slug: string;
  libelle: string;
  services: ServiceReferentiel[];
}

interface Referentiel {
  perimetresMinisteriels: PerimetreMinisterielReferentiel[];
}

interface CsvRow {
  Nom_du_service: string;
  Ministere: string;
  Echelon: string;
  Perimetre_ministeriel: string;
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

  const rows: CsvRow[] = parse(csvContent, {
    columns: true,
    skipEmptyLines: true,
    trim: true,
  });

  const perimetresMap = new Map<string, PerimetreMinisterielReferentiel>();

  for (const row of rows) {
    const nomService = row.Nom_du_service;
    const perimetreMinisteriel = row.Perimetre_ministeriel.replace(
      /^"+|"+$/g,
      "",
    );

    if (!nomService) continue;

    // Handle "Autre" row where Perimetre_ministeriel is empty
    const perimetreLibelle = perimetreMinisteriel || "Autre";
    const perimetreSlug = slugify(perimetreLibelle);

    if (!perimetresMap.has(perimetreSlug)) {
      perimetresMap.set(perimetreSlug, {
        slug: perimetreSlug,
        libelle: perimetreLibelle,
        services: [],
      });
    }

    const serviceSlug = slugify(nomService);
    const perimetreData = perimetresMap.get(perimetreSlug)!;

    // Avoid duplicates
    if (!perimetreData.services.some((s) => s.slug === serviceSlug)) {
      perimetreData.services.push({
        slug: serviceSlug,
        libelle: nomService,
      });
    }
  }

  // Convert to array and sort
  const perimetresMinisteriels = Array.from(perimetresMap.values());

  // Sort périmètres alphabetically by libelle
  perimetresMinisteriels.sort((a, b) =>
    a.libelle.localeCompare(b.libelle, "fr"),
  );

  // Sort services within each périmètre alphabetically by libelle
  for (const perimetre of perimetresMinisteriels) {
    perimetre.services.sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  }

  // Move "Autre" périmètre to the end
  const autreIndex = perimetresMinisteriels.findIndex(
    (m) => m.slug === "autre",
  );
  if (autreIndex !== -1) {
    const [autre] = perimetresMinisteriels.splice(autreIndex, 1);
    perimetresMinisteriels.push(autre);
  }

  // Ensure "Autre" périmètre exists at the end with "Autre" service
  const autrePerimetre = perimetresMinisteriels.find(
    (perimetre) => perimetre.slug === "autre",
  );
  if (autrePerimetre) {
    if (!autrePerimetre.services.some((service) => service.slug === "autre")) {
      autrePerimetre.services.push({ slug: "autre", libelle: "Autre" });
    }
  } else {
    perimetresMinisteriels.push({
      slug: "autre",
      libelle: "Autre",
      services: [{ slug: "autre", libelle: "Autre" }],
    });
  }

  // For each périmètre, move "Autre" service to the end
  for (const perimetre of perimetresMinisteriels) {
    const autreServiceIndex = perimetre.services.findIndex(
      (service) => service.slug === "autre",
    );
    if (autreServiceIndex !== -1) {
      const [autreService] = perimetre.services.splice(autreServiceIndex, 1);
      perimetre.services.push(autreService);
    }
  }

  const referentiel: Referentiel = { perimetresMinisteriels };

  const outputPath = path.join(
    process.cwd(),
    "src",
    "client",
    "constants",
    "referentiel-services.json",
  );

  fs.writeFileSync(outputPath, JSON.stringify(referentiel, null, 2), "utf-8");

  console.log(`✅ Référentiel généré : ${outputPath}`);
  console.log(
    `   ${referentiel.perimetresMinisteriels.length} périmètres ministériels`,
  );
  console.log(
    `   ${referentiel.perimetresMinisteriels.reduce((acc, perimetre) => acc + perimetre.services.length, 0)} services au total`,
  );
}

genererReferentiel();
