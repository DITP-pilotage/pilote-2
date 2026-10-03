import { Content } from "pdfmake/interfaces";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { blocPdf, separatorPdf, TEXT_COLOR } from "@/server/pdf/primitives";
import { px } from "@/server/pdf/units";
import { ChantierRapportDetailleWithoutMailles } from "@/server/rapport-detaille/rapportDetaille.interface";

const COORDINATEUR_ADJECTIVES: Record<Maille, string> = {
  nationale: "national",
  departementale: "departemental",
  regionale: "regional",
};

function responsablesLine(libellé: string, noms: string[]): Content {
  return {
    columns: [
      {
        width: "40%",
        text: libellé,
        bold: true,
        fontSize: px(16),
        color: TEXT_COLOR,
      },
      {
        width: "*",
        text: noms.length > 0 ? noms.join(", ") : "Non renseigné",
        fontSize: px(16),
        color: TEXT_COLOR,
      },
    ],
    columnGap: px(24),
    margin: [0, px(8), 0, px(8)],
  };
}

export function responsablesPdf(
  chantier: ChantierRapportDetailleWithoutMailles,
  territoireMaille: Maille,
): Content {
  const lines: Content[] = [
    responsablesLine(
      "Directeur(s) / directrice(s) du projet",
      chantier.responsables.directeursProjet.map((directeur) => directeur.nom),
    ),
  ];
  if (territoireMaille !== "nationale") {
    lines.push(
      separatorPdf(),
      responsablesLine(
        "Responsable local",
        chantier.responsableLocalTerritoireSélectionné.map(
          (responsable) => responsable.nom,
        ),
      ),
      separatorPdf(),
      responsablesLine(
        `Coordinateur PILOTE ${COORDINATEUR_ADJECTIVES[territoireMaille]}`,
        chantier.coordinateurTerritorialTerritoireSélectionné.map(
          (coordinateur) => coordinateur.nom,
        ),
      ),
    );
  }
  return blocPdf({ titre: "National", content: { stack: lines } });
}
