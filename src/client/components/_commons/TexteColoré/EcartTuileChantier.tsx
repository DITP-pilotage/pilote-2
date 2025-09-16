import { clsxm } from "@/utils/clsxm";

const definirCouleurEcartArrondi = (
  ecart: number | null,
  estArchive?: boolean,
) => {
  if (ecart === null) return null;

  const ecartArrondi = +ecart.toFixed(1) || 0;
  const couleur = estArchive
    ? "text-success"
    : ecartArrondi <= -10
      ? "text-error"
      : ecartArrondi >= 10
        ? "text-success"
        : "text-primary";

  return { ecartArrondi, couleur };
};

export const EcartTuileChantier = ({
  ecart,
  chantiersSontArchives,
}: {
  ecart: number | null;
  chantiersSontArchives: boolean;
}) => {
  const couleurEcartArrondi = definirCouleurEcartArrondi(
    ecart,
    chantiersSontArchives,
  );

  if (couleurEcartArrondi === null) return null;

  return (
    <div className={clsxm("bold", couleurEcartArrondi.couleur)}>
      {couleurEcartArrondi.ecartArrondi.toFixed(1)}
    </div>
  );
};
