import { FunctionComponent, useMemo, useState } from "react";
import {
  FEATURE_FLIP_KEYS,
  FEATURE_FLIP_LABELS,
  FeatureFlipKey,
} from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { Switch } from "@/components/shared/Switch";
import { Callout } from "@/components/shared/Callout";
import { useFeatureFlipping } from "./useFeatureFlipping";

const FeatureFlipRow: FunctionComponent<{
  ffKey: FeatureFlipKey;
  actif: boolean;
  modifie: boolean;
  onToggle: (key: FeatureFlipKey, value: boolean) => void;
}> = ({ ffKey, actif, modifie, onToggle }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {FEATURE_FLIP_LABELS[ffKey]}
          </span>
          {modifie && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-dsfr-warning-950 text-dsfr-warning-425">
              modifie
            </span>
          )}
        </div>
        <code className="text-[11px] text-gray-400 truncate">{ffKey}</code>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-xs font-medium ${actif ? "text-dsfr-success-425" : "text-gray-400"}`}
        >
          {actif ? "Actif" : "Inactif"}
        </span>
        <Switch.Root
          aria-label={FEATURE_FLIP_LABELS[ffKey]}
          checked={actif}
          onCheckedChange={(checked) => onToggle(ffKey, checked)}
        >
          <Switch.Thumb />
        </Switch.Root>
      </div>
    </div>
  );
};

export const PagePanelAdministrateurFeatureFlipping: FunctionComponent = () => {
  const {
    featureFlips,
    isLoading,
    toggleFeatureFlip,
    sauvegarder,
    estSauvegarde,
    erreur,
    estEnCoursDeSauvegarde,
    hasChanges,
    modifiedKeys,
  } = useFeatureFlipping();

  const [recherche, setRecherche] = useState("");

  const filteredKeys = useMemo(() => {
    if (!recherche.trim()) return [...FEATURE_FLIP_KEYS];
    const q = recherche.toLowerCase();
    return FEATURE_FLIP_KEYS.filter(
      (key) =>
        FEATURE_FLIP_LABELS[key].toLowerCase().includes(q) ||
        key.toLowerCase().includes(q),
    );
  }, [recherche]);

  if (isLoading || !featureFlips) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Chargement des feature flips...</p>
      </div>
    );
  }

  const nbActifs = FEATURE_FLIP_KEYS.filter((k) => featureFlips[k]).length;

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {estSauvegarde && (
        <Callout.Root color="success">
          <Callout.Icon />
          <Callout.Text>
            Les feature flips ont bien été sauvegardés.
          </Callout.Text>
        </Callout.Root>
      )}
      {erreur && (
        <Callout.Root color="error">
          <Callout.Icon />
          <Callout.Text>{erreur}</Callout.Text>
        </Callout.Root>
      )}

      {/* Barre de stats + recherche */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {nbActifs} / {FEATURE_FLIP_KEYS.length} actifs
          </span>
        </div>
        <input
          className="border !rounded-t !border-b !border-b-gray-600 !bg-white !py-2 !px-4 text-sm w-64"
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un feature flip..."
          type="text"
          value={recherche}
        />
      </div>

      {/* Liste des feature flips */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredKeys.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Aucun feature flip ne correspond à la recherche.
          </div>
        ) : (
          filteredKeys.map((key) => (
            <FeatureFlipRow
              actif={featureFlips[key]}
              ffKey={key}
              key={key}
              modifie={modifiedKeys.has(key)}
              onToggle={toggleFeatureFlip}
            />
          ))
        )}
      </div>

      {/* Barre d'action sticky */}
      {hasChanges && (
        <div className="sticky bottom-4 flex items-center justify-between bg-white border border-gray-200 rounded-lg shadow-lg px-6 py-3">
          <span className="text-sm text-gray-600">
            {modifiedKeys.size} modification(s) en attente
          </span>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            disabled={estEnCoursDeSauvegarde}
            onClick={sauvegarder}
            type="button"
          >
            {estEnCoursDeSauvegarde ? "Sauvegarde en cours..." : "Sauvegarder"}
          </button>
        </div>
      )}
    </div>
  );
};
