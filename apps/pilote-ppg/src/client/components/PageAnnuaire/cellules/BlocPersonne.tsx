import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";
import type { PersonneAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";
import { BoutonCopierEmail } from "./BoutonCopierEmail";

export function BlocPersonne({ personne }: { personne: PersonneAnnuaire }) {
  const nomComplet = `${personne.prenom} ${personne.nom}`;

  return (
    <div className="flex flex-col gap-0.5">
      <p className="!m-0 text-sm">
        <NomUtilisateurAvecTooltip
          className="font-medium decoration-dotted decoration-dsfr-grey-625 underline-offset-4 hover:decoration-dsfr-grey-200"
          fonction={personne.fonction}
          nom={nomComplet}
          service={personne.service}
        />
      </p>
      <div className="flex items-center gap-1">
        <a
          className="bg-none text-sm text-primary underline decoration-primary/30 decoration-1 underline-offset-4 break-all hover:decoration-primary"
          href={`mailto:${personne.email}`}
        >
          {personne.email}
        </a>
        <BoutonCopierEmail email={personne.email} nomComplet={nomComplet} />
      </div>
    </div>
  );
}
