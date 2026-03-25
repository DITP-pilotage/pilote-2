import { useMemo } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { buildJalons } from "@/client/utils/jalons";

export const useTauxAvancementParJalon = ({
  indicateurId,
  chantierId,
}: {
  indicateurId: string;
  chantierId: string;
}) => {
  const jalons = useMemo(() => buildJalons(), []);

  const [results] = api.useSuspenseQueries((t) =>
    jalons.map((jalon) =>
      t.indicateur.recupererTauxAvancementTerritoires({
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
