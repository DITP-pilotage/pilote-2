import { getAnneeDateDeBascule } from "@/client/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { useEnv } from "@/client/hooks/useEnv";
import { buildJalons } from "@/client/utils/jalons";

const listeJalonAAfficher = buildJalons().map(String);
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
