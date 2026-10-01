import { Fragment, ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Modale } from "@/components/shared/Modale";
import { Icone } from "@/components/_commons/Icone";
import { Eye1Icon } from "@/components/_commons/Icones/Eye1Icon";
import { AffichagePublication } from "@/components/PageChantier/Publication/Affichage/AffichagePublication";
import { Publication } from "@/components/PageChantier/Publication/Publication.interface";

type HistoriquePublicationProps<P extends Publication> = {
  title: string;
  sousTitre?: string;
  ariaLabel?: string;
  historique: P[] | undefined;
  aside?: (publication: P) => ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const HistoriquePublication = <P extends Publication>({
  title,
  sousTitre,
  ariaLabel,
  historique,
  aside,
  open,
  onOpenChange,
}: HistoriquePublicationProps<P>) => (
  <Modale
    onOpenChange={onOpenChange}
    open={open}
    sousTitre={sousTitre}
    title={title}
    trigger={
      <Button
        variant="link"
        aria-label={ariaLabel}
        className="fr-mt-1w fr-ml-3w"
        iconLeft={<Icone className="w-4 h-4 !text-current" icone={Eye1Icon} />}
        type="button"
      >
        Voir l'historique
      </Button>
    }
  >
    {historique ? (
      historique.map((item, index) => (
        <Fragment key={item.dateModification}>
          {index !== 0 && <hr className="fr-mt-4w" />}
          <AffichagePublication aside={aside?.(item)} commentaire={item} />
        </Fragment>
      ))
    ) : (
      <p>Chargement de l'historique...</p>
    )}
  </Modale>
);
