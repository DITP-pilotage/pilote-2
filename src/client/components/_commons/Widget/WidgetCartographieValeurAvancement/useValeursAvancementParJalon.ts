import { useMemo } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { ValeurAvancementIndicateurTerritoire } from "@/server/chantiers/infrastructure/queries/RecupererValeursAvancementIndicateurTerritoiresQuery";

const PREMIER_JALON = 2022;

const buildJalons = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from(
    { length: currentYear - PREMIER_JALON + 1 },
    (_, i) => PREMIER_JALON + i,
  );
};

export const useValeursAvancementParJalon = ({
  indicateurId,
  chantierId,
}: {
  indicateurId: string;
  chantierId: string;
}) => {
  const jalons = useMemo(() => buildJalons(), []);

  const [results] = api.useSuspenseQueries((t) =>
    jalons.map((jalon) =>
      t.indicateur.recupererValeursAvancementTerritoires({
        indicateurId,
        chantierId,
        jalon,
      }),
    ),
  );

  const donneesParJalon = useMemo(
    () => new Map(jalons.map((jalon, index) => [jalon, results[index]])),
    [jalons, results],
  );

  return { jalons, donneesParJalon };
};
