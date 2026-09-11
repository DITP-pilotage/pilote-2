import { faker } from "@faker-js/faker/locale/fr";
import {
  codeInseeFrance,
  codesInseeDépartements,
  codesInseeRégions,
} from "@/server/domain/territoire/Territoire.interface";

// `faker.helpers.unique` a été retiré en faker 9. Il rejouait la fonction jusqu'à
// obtenir une valeur jamais rendue dans le processus courant. On réimplémente
// exactement ce contrat, en conservant le format à 7 chiffres.
const suffixesDéjàGénérés = new Set<string>();

export function générerUnIdentifiantUnique(prefixe: string) {
  let suffixe = faker.string.numeric(7);
  while (suffixesDéjàGénérés.has(suffixe)) {
    suffixe = faker.string.numeric(7);
  }
  suffixesDéjàGénérés.add(suffixe);
  return `${prefixe}-${suffixe}`;
}

export function générerCaractèresSpéciaux(nombre: number) {
  const caractères = ["/", ":", "@", "[", "]", "#", "é"];
  return Array.from({ length: nombre })
    .map(() => caractères[Math.floor(Math.random() * caractères.length)])
    .join("");
}

export function générerUnTableauVideAvecUneTailleDeZéroÀn(
  nombreMaxÉléments = 4,
) {
  const nombreItération = Math.floor(Math.random() * (nombreMaxÉléments + 1));
  return Array.from({ length: nombreItération });
}

export function générerUneMailleAléatoire(): "DEPT" | "REG" | "NAT" {
  return faker.helpers.arrayElement(["DEPT", "REG", "NAT"]);
}

export function générerUneMailleInterneAléatoire(): "DEPT" | "REG" {
  return faker.helpers.arrayElement(["DEPT", "REG"]);
}

export function retourneUneListeDeCodeInseeCohérentePourUneMaille(
  maille: string,
) {
  if (maille === "DEPT") return codesInseeDépartements;

  if (maille === "REG") return codesInseeRégions;

  return [codeInseeFrance];
}

export function générerUnLibellé(
  nomdeDeMotsMin: number,
  nomdeDeMotsMax: number,
) {
  const nom = faker.lorem.words(
    faker.number.int({ min: nomdeDeMotsMin, max: nomdeDeMotsMax }),
  );
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

export function générerTableau<T>(
  nombreOccurrenceMin: number,
  nombreOccurrenceMax: number,
  entitéBuilder: (i: number) => T,
): T[] {
  return Array.from({
    length: faker.number.int({
      min: nombreOccurrenceMin,
      max: nombreOccurrenceMax,
    }),
  }).map((_, i) => entitéBuilder(i));
}

export function générerPeutÊtreNull<T>(
  probabilitéNull: number,
  valeurSinon: T,
): T | null {
  return faker.number.float({ min: 0, max: 1, multipleOf: 0.001 }) <
    probabilitéNull
    ? null
    : valeurSinon;
}
