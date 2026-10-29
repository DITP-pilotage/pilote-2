import { getAnneeDateDeBascule } from "@/client/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { useEnv } from "@/client/hooks/useEnv";
import { useNow } from "@/client/hooks/useNow";
import { buildJalons } from "@/client/utils/jalons";

const listeJalonAAfficher = buildJalons().map(String);
export type JalonsAAfficherType = (typeof listeJalonAAfficher)[number];

export const useSelecteurJalon = () => {
  const dateBasculeValeurAnneePrecedente = useEnv(
    "NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE",
  );
  const now = useNow();
  const jalonAAfficherParDefaut: JalonsAAfficherType = getAnneeDateDeBascule(
    now,
    dateBasculeValeurAnneePrecedente,
  ).toString();
  const listeOptionsJalon: {
    libelle: JalonsAAfficherType;
    valeur: JalonsAAfficherType;
  }[] = listeJalonAAfficher.map((jalon) => ({ libelle: jalon, valeur: jalon }));

  return {
    listeJalonAAfficher,
    jalonAAfficherParDefaut,
    listeOptionsJalon,
  };
};
