import { getAnneeDateDeBascule } from "@/client/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { useEnv } from "@/client/hooks/useEnv";

const PREMIER_JALON = 2022;
const listeJalonAAfficher = Array.from(
  { length: new Date().getFullYear() - PREMIER_JALON + 1 },
  (_value, i) => `${PREMIER_JALON + i}`,
);
export type JalonsAAfficherType = (typeof listeJalonAAfficher)[number];

export const useSelecteurJalon = () => {
  const dateBasculeValeurAnneePrecedente = useEnv(
    "NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE",
  );
  const jalonAAfficherParDefaut: JalonsAAfficherType = getAnneeDateDeBascule(
    new Date(),
    dateBasculeValeurAnneePrecedente,
  ).toString();
  const listeOptionsJalon: {
    libellé: JalonsAAfficherType;
    valeur: JalonsAAfficherType;
  }[] = listeJalonAAfficher.map((jalon) => ({ libellé: jalon, valeur: jalon }));

  return {
    listeJalonAAfficher,
    jalonAAfficherParDefaut,
    listeOptionsJalon,
  };
};
