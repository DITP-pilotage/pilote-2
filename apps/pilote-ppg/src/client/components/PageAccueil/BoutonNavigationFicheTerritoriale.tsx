import Link from "next/link";
import { Icone } from "@/components/_commons/Icone";
import { ArticleContourIcon } from "@/components/_commons/Icones/ArticleContourIcon";
import { ACCUEIL_NAV_LINK_CLASSES } from "./accueilNavLinkClasses";

export const BoutonNavigationFicheTerritoriale = ({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}) => {
  if (territoireCode === "NAT-FR") {
    return (
      <div className="inline-flex items-center gap-1 w-fit pb-0.5 text-sm text-dsfr-grey-625">
        <Icone className="w-4 h-4 text-current" icone={ArticleContourIcon} />
        Fiche territoriale
      </div>
    );
  }

  return (
    <Link
      className={ACCUEIL_NAV_LINK_CLASSES}
      href={`/fiche-territoriale?territoireCode=${territoireCode}&jalon=${jalon}`}
      title="Voir la fiche territoriale"
    >
      <Icone className="w-4 h-4" icone={ArticleContourIcon} />
      Fiche territoriale
    </Link>
  );
};
