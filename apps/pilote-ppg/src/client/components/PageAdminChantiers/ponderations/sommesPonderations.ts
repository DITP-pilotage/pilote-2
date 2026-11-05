import { MAILLES, Maille } from "@/server/parametrage-chantier/domain/maille";

export interface LignePonderationSomme {
  estActif: boolean;
  maillesApplicables: Maille[];
  poidsPourcentDept: number | null;
  poidsPourcentReg: number | null;
  poidsPourcentNat: number | null;
}

export const CHAMP_POIDS_PAR_MAILLE: Record<
  Maille,
  "poidsPourcentDept" | "poidsPourcentReg" | "poidsPourcentNat"
> = {
  NAT: "poidsPourcentNat",
  REG: "poidsPourcentReg",
  DEPT: "poidsPourcentDept",
};

const arrondirADeuxDecimales = (valeur: number) =>
  Math.round(valeur * 100) / 100;

export function calculerSommesParMaille(
  lignes: LignePonderationSomme[],
): Partial<Record<Maille, number>> {
  const sommes: Partial<Record<Maille, number>> = {};
  for (const maille of MAILLES) {
    const lignesComptees = lignes.filter(
      (ligne) => ligne.estActif && ligne.maillesApplicables.includes(maille),
    );
    if (lignesComptees.length === 0) continue;
    sommes[maille] = arrondirADeuxDecimales(
      lignesComptees.reduce(
        (total, ligne) => total + (ligne[CHAMP_POIDS_PAR_MAILLE[maille]] ?? 0),
        0,
      ),
    );
  }
  return sommes;
}
