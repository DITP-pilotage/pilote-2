import type { PersonneAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";
import { BoutonCopierEmail } from "./BoutonCopierEmail";

export function BlocPersonne({ personne }: { personne: PersonneAnnuaire }) {
  const nomComplet = `${personne.prenom} ${personne.nom}`;
  const detail = [personne.fonction, personne.service]
    .filter((valeur): valeur is string => Boolean(valeur))
    .join(", ");

  return (
    <div className="flex flex-col gap-0.5">
      <p className="!m-0 text-sm">
        <span className="font-medium">{nomComplet}</span>
        {detail && <span className="text-dsfr-mention-grey"> · {detail}</span>}
      </p>
      <div className="flex items-center gap-1">
        <a
          className="text-sm text-primary underline underline-offset-2 break-all"
          href={`mailto:${personne.email}`}
        >
          {personne.email}
        </a>
        <BoutonCopierEmail email={personne.email} nomComplet={nomComplet} />
      </div>
    </div>
  );
}
