import Link from "next/link";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { ArticleContourIcon } from "@/components/_commons/Icones/ArticleContourIcon";

export const BoutonNavigationFicheConducteur = ({
  chantierEstArchive,
  chantierId,
  jalon,
}: {
  chantierEstArchive: boolean;
  chantierId: string;
  jalon: number;
}) => (
  <Link
    className={clsxm("!text-sm flex align-center gap-1 pb-1 border-current", {
      "!text-dsfr-grey-200": chantierEstArchive,
    })}
    href={`/chantier/${chantierId}/fiche-conducteur?jalon=${jalon}`}
    title="Fiche conducteur"
  >
    <Icone className="w-4 h-4 !text-current" icone={ArticleContourIcon} />
    Fiche conducteur
  </Link>
);
