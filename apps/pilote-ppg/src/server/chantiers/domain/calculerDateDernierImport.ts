import {
  $Enums,
  indicateur_territoire_valeur_evenement as PrismaIndicateurTerritoireValeurEvenement,
} from "@prisma/client";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";

export function calculerDateDernierImport(
  maille: $Enums.Maille,
  dateDerniereExecutionDatajobs: Date,
  evenementsTerritoire: PrismaIndicateurTerritoireValeurEvenement[],
  evenementsMailles: PrismaIndicateurTerritoireValeurEvenement[],
  origineVaNat: string | null,
  origineVaReg: string | null,
  codesTerritoiresEnfants: string[] = [],
): Date | null {
  let evenementsAUtiliser = evenementsTerritoire;

  if (maille === "NAT" || maille === "REG") {
    let mailleSource: string | null = null;
    if (
      maille === "NAT" &&
      origineVaNat &&
      ["DEPT", "REG"].includes(origineVaNat)
    ) {
      mailleSource = origineVaNat;
    } else if (maille === "REG" && origineVaReg === "DEPT") {
      mailleSource = "DEPT";
    }

    if (mailleSource) {
      if (maille === "REG" && mailleSource === "DEPT") {
        evenementsAUtiliser = evenementsMailles.filter((evenement) =>
          codesTerritoiresEnfants.includes(evenement.territoire_code),
        );
      } else {
        evenementsAUtiliser = evenementsMailles.filter((evenement) =>
          evenement.territoire_code.startsWith(mailleSource!),
        );
      }
    }
  }

  const evenementsImport = evenementsAUtiliser.filter(
    (evenement) =>
      [
        EvenementValeurEnum.VALEUR_CREEE,
        EvenementValeurEnum.VALEUR_MODIFIEE,
      ].includes(evenement.type_evenement as EvenementValeurEnum) &&
      evenement.date_creation < dateDerniereExecutionDatajobs,
  );

  if (evenementsImport.length === 0) {
    return null;
  }

  return evenementsImport.reduce((maxDate, evenement) => {
    return evenement.date_creation > maxDate
      ? evenement.date_creation
      : maxDate;
  }, evenementsImport[0].date_creation);
}
