import { toast } from "sonner";
import { BoutonCopier } from "@/components/_commons/BoutonCopier/BoutonCopier";
import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";
import type { PersonneAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";

export function BlocPersonne({ personne }: { personne: PersonneAnnuaire }) {
  const nomComplet = `${personne.prenom} ${personne.nom}`;

  const copierEmail = async () => {
    try {
      await navigator.clipboard.writeText(personne.email);
      toast.success("Adresse e-mail copiée");
    } catch {
      toast.error("L'adresse e-mail n'a pas pu être copiée");
    }
  };

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
      <p className="!m-0 text-sm [overflow-wrap:anywhere]">
        <a
          className="bg-none text-primary underline decoration-primary/30 decoration-1 underline-offset-4 hover:decoration-primary"
          href={`mailto:${personne.email}`}
        >
          {personne.email}
        </a>
        <BoutonCopier
          className="ml-1.5 align-middle"
          libelle={`Copier l'adresse e-mail de ${nomComplet}`}
          onClick={() => void copierEmail()}
        />
      </p>
    </div>
  );
}
