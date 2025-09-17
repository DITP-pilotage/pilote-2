import Link from "next/link";
import { Icone } from "@/components/_commons/Icone";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";

export const BoutonNavigationMiseAJourDonnee = ({
  chantierId,
}: {
  chantierId: string;
}) => (
  <Link
    className="!text-sm flex align-center gap-1 pb-1"
    href={`/chantier/${chantierId}/indicateurs`}
    title="Mettre à jour les données"
  >
    <Icone className="w-4 h-4" icone={Download1Icon} />
    Mettre à jour les données
  </Link>
);
