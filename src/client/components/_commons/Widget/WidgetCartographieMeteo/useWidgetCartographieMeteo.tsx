import { ReactNode, useCallback, useMemo } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";
import { determinerRemplissageMeteo } from "@/client/utils/meteo/determinerRemplissageMeteo";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";

export const useWidgetCartographieMeteo = (params: {
  chantierId: string;
  territoireCode: string;
  jalon: number;
}) => {
  const { chantierId, territoireCode, jalon } = params;

  const [territoiresCompares, setTerritoiresCompares] =
    useTerritoiresCompares();

  const { data: territoiresMeteo, isLoading } =
    api.chantier.recupererMeteosTerritoires.useQuery({
      chantierId,
      jalon,
    });

  const selectedTerritoireCodes = useMemo(() => {
    const fromUrl = territoiresCompares.split(",").filter(Boolean);
    return [territoireCode, ...fromUrl];
  }, [territoireCode, territoiresCompares]);

  const donneesCartographie = useMemo(() => {
    if (!territoiresMeteo)
      return {} as Record<
        string,
        { remplissage: string; libelle: string; contenuInfoBulle?: ReactNode }
      >;

    return territoiresMeteo.reduce(
      (acc, territoire) => {
        const meteo = territoire.meteo as Météo;
        return {
          ...acc,
          [territoire.territoireCode]: {
            remplissage: determinerRemplissageMeteo(
              meteo,
              ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS,
              territoire.estApplicable,
            ),
            libelle: territoire.territoireNom,
            contenuInfoBulle: (
              <div className="fr-text--bold">
                {territoire.estApplicable === false
                  ? "Non applicable"
                  : libellésMétéos[meteo]}
              </div>
            ),
          },
        };
      },
      {} as Record<
        string,
        { remplissage: string; libelle: string; contenuInfoBulle?: ReactNode }
      >,
    );
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

  const updateUrlTerritoires = useCallback(
    (codes: string[]) => {
      const withoutCurrent = codes.filter((code) => code !== territoireCode);
      setTerritoiresCompares(withoutCurrent.join(","));
    },
    [territoireCode, setTerritoiresCompares],
  );

  const auClicTerritoire = useCallback(
    (clickedCode: string) => {
      if (!territoiresMeteo) return;

      const territoire = territoiresMeteo.find(
        (terr) => terr.territoireCode === clickedCode,
      );
      if (!territoire) return;

      if (selectedTerritoireCodes.includes(clickedCode)) {
        updateUrlTerritoires(
          selectedTerritoireCodes.filter((code) => code !== clickedCode),
        );
      } else {
        updateUrlTerritoires([...selectedTerritoireCodes, clickedCode]);
      }
    },
    [territoiresMeteo, selectedTerritoireCodes, updateUrlTerritoires],
  );

  const ajouterTerritoire = useCallback(
    (code: string) => {
      if (selectedTerritoireCodes.includes(code)) return;
      updateUrlTerritoires([...selectedTerritoireCodes, code]);
    },
    [selectedTerritoireCodes, updateUrlTerritoires],
  );

  const ajouterTerritoires = useCallback(
    (codes: string[]) => {
      const existing = new Set(selectedTerritoireCodes);
      const nouveaux = codes.filter((code) => !existing.has(code));
      updateUrlTerritoires([...selectedTerritoireCodes, ...nouveaux]);
    },
    [selectedTerritoireCodes, updateUrlTerritoires],
  );

  const supprimerTerritoire = useCallback(
    (code: string) => {
      updateUrlTerritoires(
        selectedTerritoireCodes.filter((c) => c !== code),
      );
    },
    [selectedTerritoireCodes, updateUrlTerritoires],
  );

  return {
    donneesCartographie,
    legende,
    territoiresSelectionnes,
    auClicTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
    isLoading,
  };
};
