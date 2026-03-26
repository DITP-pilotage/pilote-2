import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import type {
  FeatureFlipKey,
  FeatureFlipMap,
} from "@/server/gestion-contenu/domain/VariableContenuDisponible";

export const useFeatureFlipping = () => {
  const utils = api.useUtils();

  const { data: featureFlips, isLoading } =
    api.gestionContenu.recupererFeatureFlips.useQuery();

  const [localOverrides, setLocalOverrides] = useState<
    Partial<Record<FeatureFlipKey, boolean>>
  >({});

  const [estSauvegarde, setEstSauvegarde] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const mutation = api.gestionContenu.modifierFeatureFlips.useMutation({
    onSuccess: () => {
      setEstSauvegarde(true);
      setLocalOverrides({});
      setErreur(null);
      void utils.gestionContenu.recupererFeatureFlips.invalidate();
      void utils.gestionContenu.recupererToutesLesVariablesContenu.invalidate();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setEstSauvegarde(false), 3000);
    },
    onError: (error) => {
      setErreur(error.message);
    },
  });

  const valeursMerged: FeatureFlipMap | undefined = featureFlips
    ? { ...featureFlips, ...localOverrides }
    : undefined;

  const toggleFeatureFlip = useCallback(
    (key: FeatureFlipKey, value: boolean) => {
      setLocalOverrides((prev) => ({ ...prev, [key]: value }));
      setEstSauvegarde(false);
    },
    [],
  );

  const sauvegarder = useCallback(() => {
    if (Object.keys(localOverrides).length === 0) return;
    mutation.mutate({ featureFlips: localOverrides });
  }, [localOverrides, mutation]);

  const modifiedKeys = useMemo(
    () => new Set(Object.keys(localOverrides) as FeatureFlipKey[]),
    [localOverrides],
  );

  const hasChanges = modifiedKeys.size > 0;

  return {
    featureFlips: valeursMerged,
    isLoading,
    toggleFeatureFlip,
    sauvegarder,
    estSauvegarde,
    erreur,
    estEnCoursDeSauvegarde: mutation.isPending,
    hasChanges,
    modifiedKeys,
  };
};
