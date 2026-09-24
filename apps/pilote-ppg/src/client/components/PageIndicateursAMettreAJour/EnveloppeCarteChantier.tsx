import { useId, type ReactNode } from "react";
import Link from "next/link";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";

export const EnveloppeCarteChantier = ({
  chantierId,
  chantierNom,
  badge,
  children,
}: {
  chantierId: string;
  chantierNom: string;
  badge: ReactNode;
  children: ReactNode;
}) => {
  const idTitre = useId();

  return (
    <section
      aria-labelledby={idTitre}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white"
    >
      <div className="flex flex-col gap-3 bg-gray-50 px-4 py-4 md:flex-row md:items-center md:px-6">
        <div className="flex flex-col gap-1 md:flex-1">
          <span className="text-xs text-dsfr-mention-grey">{chantierId}</span>
          <h2 className="fr-h6 fr-mb-0" id={idTitre}>
            {chantierNom}
          </h2>
        </div>
        {badge}
        <Link
          className="inline-flex items-center gap-1 !bg-none text-sm font-medium text-primary hover:underline"
          href={`/chantier/${chantierId}/NAT-FR`}
        >
          Voir le chantier
          <Icone className="h-4 w-4 !text-current" icone={ArrowLine1Icon} />
        </Link>
      </div>
      {children}
    </section>
  );
};
