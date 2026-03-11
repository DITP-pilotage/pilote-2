import { useCallback, useMemo, useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { CartographieDonnées } from "@/client/components/_commons/Cartographie/Cartographie.interface";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";
import { determinerRemplissageMeteo } from "@/client/utils/meteo/determinerRemplissageMeteo";

export const useWidgetCartographieMeteo = (params: {
  chantierId: string;
  initialTerritoiresCodes: string[];
}) => {
  const { chantierId, initialTerritoiresCodes } = params;

  const { data: territoiresMeteo, isLoading } =
    api.chantier.recupererMeteosTerritoires.useQuery({
      chantierId,
    });

  const [selectedTerritoireCodes, setSelectedTerritoireCodes] = useState<
    string[]
  >(initialTerritoiresCodes);

  const donneesCartographie = useMemo(() => {
    if (!territoiresMeteo) return {} as CartographieDonnées;

    return territoiresMeteo.reduce((acc, territoire) => {
      const meteo = territoire.meteo as Météo;
      return {
        ...acc,
        [territoire.territoireCode]: {
          contenu: (
            <div className="fr-text--bold">
              {territoire.estApplicable === false
                ? "Non applicable"
                : libellésMétéos[meteo]}
            </div>
          ),
          remplissage: determinerRemplissageMeteo(
            meteo,
            ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS,
            territoire.estApplicable,
          ),
          libellé: territoire.territoireNom,
          estApplicable: territoire.estApplicable,
        },
      };
    }, {} as CartographieDonnées);
  }, [territoiresMeteo]);

  const legende = useMemo(() => {
    if (!territoiresMeteo) return [];

    const tousApplicables = territoiresMeteo.every(
      (territoire) => territoire.estApplicable,
    );
    const tousNonNull = territoiresMeteo.every(
      (territoire) => territoire.meteo !== "NON_RENSEIGNEE",
    );

    let legendeAffichee = Object.values(ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS);

    if (tousApplicables) {
      legendeAffichee = legendeAffichee.filter(
        (el) =>
          el.libellé !==
          "Territoire où le chantier prioritaire ne s'applique pas",
      );
    }

    if (tousNonNull) {
      legendeAffichee = legendeAffichee.filter(
        (el) =>
          el.libellé !== "Territoire pour lequel la météo n'est pas renseignée",
      );
    }

    return legendeAffichee.map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }));
  }, [territoiresMeteo]);

  const territoiresSelectionnes = useMemo(() => {
    if (!territoiresMeteo) return [];

    return territoiresMeteo.filter((territoire) =>
      selectedTerritoireCodes.includes(territoire.territoireCode),
    );
  }, [territoiresMeteo, selectedTerritoireCodes]);

  const auClicTerritoire = useCallback(
    (territoireCode: string) => {
      if (!territoiresMeteo) return;

      const territoire = territoiresMeteo.find(
        (terr) => terr.territoireCode === territoireCode,
      );
      if (!territoire) return;

      setSelectedTerritoireCodes((prev) => {
        if (prev.includes(territoire.territoireCode)) {
          return prev.filter((code) => code !== territoire.territoireCode);
        }
        return [...prev, territoire.territoireCode];
      });
    },
    [territoiresMeteo],
  );

  const ajouterTerritoire = useCallback((territoireCode: string) => {
    setSelectedTerritoireCodes((prev) => {
      if (prev.includes(territoireCode)) return prev;
      return [...prev, territoireCode];
    });
  }, []);

  const supprimerTerritoire = useCallback((territoireCode: string) => {
    setSelectedTerritoireCodes((prev) =>
      prev.filter((code) => code !== territoireCode),
    );
  }, []);

  const territoiresDisponibles = useMemo(() => {
    if (!territoiresMeteo) return [];
    return territoiresMeteo.filter(
      (territoire) =>
        !selectedTerritoireCodes.includes(territoire.territoireCode),
    );
  }, [territoiresMeteo, selectedTerritoireCodes]);

  return {
    donneesCartographie,
    legende,
    territoiresSelectionnes,
    territoiresDisponibles,
    auClicTerritoire,
    ajouterTerritoire,
    supprimerTerritoire,
    isLoading,
  };
};
