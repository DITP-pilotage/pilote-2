import { Content } from "pdfmake/interfaces";
import { libellésTypesObjectif } from "@/client/constants/libellésObjectif";
import { libellesTypesCommentaire } from "@/client/constants/libellesCommentaire";
import { libellésTypesDécisionStratégique } from "@/client/constants/libellésDécisionStratégique";
import {
  Objectif,
  typesObjectif,
} from "@/shared/chantier/objectif/Objectif.interface";
import {
  Commentaire,
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/shared/chantier/commentaire/Commentaire.interface";
import { DécisionStratégique } from "@/shared/chantier/decisionStrategique/DecisionStrategique.interface";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import {
  blocPdf,
  publicationRubriquePdf,
  separatorPdf,
} from "@/server/pdf/primitives";
import { RapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import { section } from "@/server/rapport-detaille/pdf/section";
import { findTerritoire } from "@/server/rapport-detaille/pdf/avancement";

type Publication = { contenu: string; date: string; auteur: string } | null;

function rubrique(titre: string, publication: Publication): Content {
  return publicationRubriquePdf({
    titre,
    dateEtAuteur: publication
      ? `Mis à jour le ${PiloteDateFormatter.isoDateFranceMetropolitaine(publication.date)} | Par ${publication.auteur}`
      : null,
    html: publication?.contenu ?? null,
  });
}

function publicationsBloc(titre: string, rubriques: Content[]): Content {
  return blocPdf({
    titre,
    padding: 0,
    breakable: true,
    content: {
      stack: rubriques.flatMap((content, index) =>
        index === 0 ? [content] : [separatorPdf([0, 0, 0, 0]), content],
      ),
    },
  });
}

export function objectifsPdf(objectifs: Objectif[]): Content | null {
  if (objectifs.length === 0) return null;
  const byType = new Map(
    objectifs.flatMap((objectif) =>
      objectif ? [[objectif.type, objectif]] : [],
    ),
  );
  return section(
    "Objectifs",
    publicationsBloc(
      "National",
      typesObjectif.map((type) =>
        rubrique(libellésTypesObjectif[type], byType.get(type) ?? null),
      ),
    ),
  );
}

export function commentairesPdf(
  commentaires: Commentaire[] | null,
  context: RapportDetailleContext,
): Content | null {
  if (commentaires === null) return null;
  const byType = new Map(
    commentaires.flatMap((commentaire) =>
      commentaire ? [[commentaire.type, commentaire]] : [],
    ),
  );
  const types =
    context.territoireCode === "NAT-FR"
      ? typesCommentaireMailleNationale
      : typesCommentaireMailleRégionaleOuDépartementale;
  return section(
    "Commentaires du chantier",
    publicationsBloc(
      findTerritoire(context.territoireCode)?.nomAffiché ?? "",
      types.map((type) =>
        rubrique(libellesTypesCommentaire[type], byType.get(type) ?? null),
      ),
    ),
    { breakable: true },
  );
}

export function decisionsPdf(
  décision: DécisionStratégique,
  context: RapportDetailleContext,
): Content | null {
  if (décision === null || context.territoireCode !== "NAT-FR") return null;
  return section(
    "Décisions stratégiques",
    publicationsBloc("France", [
      rubrique(
        libellésTypesDécisionStratégique.suiviDesDecisionsStrategiques,
        décision,
      ),
    ]),
  );
}
