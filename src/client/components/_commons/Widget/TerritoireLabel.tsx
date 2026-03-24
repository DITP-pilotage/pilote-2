export const TerritoireLabel = ({
  nom,
  couleur,
  onSupprimer,
}: {
  nom: string;
  couleur: string;
  onSupprimer?: () => void;
}) => (
  <div className="flex items-center gap-1">
    <span className="text-right flex-1 truncate" style={{ color: couleur }}>
      {nom}
    </span>
    {onSupprimer ? (
      <button
        onClick={onSupprimer}
        title={`Retirer ${nom}`}
        type="button"
        className="p-2 -m-2"
        style={{ color: couleur }}
      >
        ✕
      </button>
    ) : (
      <div />
    )}
  </div>
);
