import Link from "next/link";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { ArticleContourIcon } from "@/components/_commons/Icones/ArticleContourIcon";

export const BoutonNavigationFicheConducteur = ({
  chantierEstArchive,
  chantierId,
}: {
  chantierEstArchive: boolean;
  chantierId: string;
}) => (
  <Link
    className={clsxm("!text-sm flex align-center gap-1 pb-1", {
      "!text-dsfr-grey-200": chantierEstArchive,
    })}
    href={`/chantier/${chantierId}/fiche-conducteur`}
    title="Fiche conducteur"
  >
    <Icone className="w-4 h-6" icone={ArticleContourIcon} />
    Fiche conducteur
  </Link>
);
