import Link from "next/link";
import { Icone } from "@/components/_commons/Icone";
import { ArticleContourIcon } from "@/components/_commons/Icones/ArticleContourIcon";

export const BoutonNavigationFicheTerritoriale = ({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}) => {
  if (territoireCode === "NAT-FR") {
    return (
      <div className="flex align-center !text-dsfr-grey-625 !text-sm gap-1 pb-0.5 border-b-1 !border-b-transparent">
        <Icone className="w-4 h-4 !text-current" icone={ArticleContourIcon} />
        Fiche territoriale
      </div>
    );
  }

  return (
    <Link
      className="flex align-center gap-1 !text-sm gap-1 pb-1 !text-primary"
      href={`/fiche-territoriale?territoireCode=${territoireCode}&jalon=${jalon}`}
      title="Voir la fiche territoriale"
    >
      <Icone className="w-4 h-4" icone={ArticleContourIcon} />
      Fiche territoriale
    </Link>
  );
};
