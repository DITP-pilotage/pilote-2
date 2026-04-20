export const LegendeDegradeVA = ({
  libelle,
  valeurMin,
  valeurMax,
  couleurMin,
  couleurMax,
}: {
  libelle: string;
  valeurMin: string;
  valeurMax: string;
  couleurMin: string;
  couleurMax: string;
}) => {
  return (
    <div className="fr-mt-1w max-w-[25rem] mx-auto w-full">
      <p className="fr-text--xs !text-dsfr-mention-grey fr-mb-0">{libelle}</p>
      <div
        className="h-2"
        style={{
          background: `linear-gradient(90deg, ${couleurMin}, ${couleurMax})`,
        }}
      />
      <div className="flex justify-between">
        <p className="fr-text--xs !text-dsfr-mention-grey fr-mb-0">
          {valeurMin}
        </p>
        <p className="fr-text--xs !text-dsfr-mention-grey fr-mb-0">
          {valeurMax}
        </p>
      </div>
    </div>
  );
};
