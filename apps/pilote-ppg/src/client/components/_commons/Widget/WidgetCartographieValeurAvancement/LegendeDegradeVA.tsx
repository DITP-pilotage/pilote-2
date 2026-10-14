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
    <div className="mt-2 max-w-[25rem] mx-auto w-full">
      <p className="text-xs print:text-base text-dsfr-mention-grey mb-0">
        {libelle}
      </p>
      <div
        className="h-2"
        style={{
          background: `linear-gradient(90deg, ${couleurMin}, ${couleurMax})`,
        }}
      />
      <div className="flex justify-between">
        <p className="text-xs print:text-base text-dsfr-mention-grey mb-0">
          {valeurMin}
        </p>
        <p className="text-xs print:text-base text-dsfr-mention-grey mb-0">
          {valeurMax}
        </p>
      </div>
    </div>
  );
};
