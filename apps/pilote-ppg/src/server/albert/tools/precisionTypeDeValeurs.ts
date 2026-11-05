import type { ModelMessage } from "ai";
import { normaliserChaîneDeCaractères } from "@/client/utils/strings";

const NOM_DE_L_OUTIL = "get_indicateurs_a_completer";
const LONGUEUR_MINIMALE_D_UN_MOT = 3;
const LONGUEUR_MINIMALE_POUR_TOLERER_UNE_ERREUR = 5;

const EXPRESSIONS_DES_TYPES_DE_VALEURS = [
  "valeur d'avancement",
  "valeur actuelle",
  "dernière valeur",
  "périmé",
  "retard de mise à jour",
  "saisie en retard",
  "fraîcheur",
  "valeur initiale",
  "cible",
];

function extraireLesMots(texte: string): string[] {
  return normaliserChaîneDeCaractères(texte)
    .split(/[^a-z]+/)
    .filter((mot) => mot.length >= LONGUEUR_MINIMALE_D_UN_MOT)
    .map((mot) => mot.replace(/s$/, ""));
}

function aAuPlusUneErreur(mot: string, reference: string): boolean {
  if (mot === reference) return true;
  if (Math.abs(mot.length - reference.length) > 1) return false;

  let debut = 0;
  while (
    debut < mot.length &&
    debut < reference.length &&
    mot[debut] === reference[debut]
  ) {
    debut++;
  }

  const resteDuMot = mot.slice(debut + 1);
  const resteDeLaReference = reference.slice(debut + 1);
  const substitution = resteDuMot === resteDeLaReference;
  const insertion = mot.slice(debut) === resteDeLaReference;
  const suppression = resteDuMot === reference.slice(debut);
  const inversion =
    mot[debut] === reference[debut + 1] &&
    mot[debut + 1] === reference[debut] &&
    mot.slice(debut + 2) === reference.slice(debut + 2);

  return substitution || insertion || suppression || inversion;
}

function motCorrespond(mot: string, motAttendu: string): boolean {
  if (motAttendu.length < LONGUEUR_MINIMALE_POUR_TOLERER_UNE_ERREUR) {
    return mot === motAttendu;
  }
  return aAuPlusUneErreur(mot, motAttendu);
}

function contientLExpression(mots: string[], expression: string[]): boolean {
  for (let debut = 0; debut + expression.length <= mots.length; debut++) {
    const trouvee = expression.every((motAttendu, position) =>
      motCorrespond(mots[debut + position], motAttendu),
    );
    if (trouvee) return true;
  }
  return false;
}

export function nommeUnTypeDeValeurs({ texte }: { texte: string }): boolean {
  const motsBruts = texte.split(/[^\p{L}]+/u);
  const nommeUnSigle = motsBruts.some(
    (mot) => mot === "VA" || /^(vi|vc)$/i.test(mot),
  );
  if (nommeUnSigle) return true;

  const mots = extraireLesMots(texte);
  return EXPRESSIONS_DES_TYPES_DE_VALEURS.some((expression) =>
    contientLExpression(mots, extraireLesMots(expression)),
  );
}

function texteDuMessage(message: ModelMessage): string {
  if (typeof message.content === "string") return message.content;
  return message.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function valeurContientUneReponseDeLOutil(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    ("en_bref" in value || "precision_demandee" in value)
  );
}

function aDejaRepondu(messagesPrecedents: ModelMessage[]): boolean {
  return messagesPrecedents.some(
    (message) =>
      message.role === "tool" &&
      message.content.some(
        (part) =>
          part.type === "tool-result" &&
          part.toolName === NOM_DE_L_OUTIL &&
          part.output.type === "json" &&
          valeurContientUneReponseDeLOutil(part.output.value),
      ),
  );
}

export function doitDemanderPrecision({
  messages,
}: {
  messages: ModelMessage[];
}): boolean {
  const indexDuDernierMessageUtilisateur = messages.findLastIndex(
    (message) => message.role === "user",
  );
  if (indexDuDernierMessageUtilisateur === -1) return true;

  const texte = texteDuMessage(messages[indexDuDernierMessageUtilisateur]);
  if (nommeUnTypeDeValeurs({ texte })) return false;

  return !aDejaRepondu(messages.slice(0, indexDuDernierMessageUtilisateur));
}
