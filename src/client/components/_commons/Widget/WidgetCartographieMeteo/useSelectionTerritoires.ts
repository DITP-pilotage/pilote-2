import { useCallback, useMemo } from "react";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import { MeteoTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";

export const useSelectionTerritoires = ({
  territoiresMeteo,
  territoireCode,
}: {
  territoiresMeteo: MeteoTerritoireViewModel[];
  territoireCode: string;
}) => {
  const [territoiresCompares, setTerritoiresCompares] =
    useTerritoiresCompares();

  const selectedTerritoireCodes = useMemo(() => {
    const fromUrl = territoiresCompares.split(",").filter(Boolean);
    return [territoireCode, ...fromUrl];
  }, [territoireCode, territoiresCompares]);

  const territoiresSelectionnes = useMemo(() => {
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

  const onSelectTerritoire = useCallback(
    (clickedCode: string) => {
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
    territoiresSelectionnes,
    onSelectTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
  };
};
