import { Fragment } from "react";
import { Modale } from "@/components/shared/Modale";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Icone } from "@/components/_commons/Icone";
import { Eye1Icon } from "@/components/_commons/Icones/Eye1Icon";
import { AffichagePublication } from "@/components/PageChantier/PublicationV2/Affichage/AffichagePublication";
import { Publication } from "@/components/PageChantier/PublicationV2/Publication.interface";

type HistoriquePublicationProps = {
  title: string;
  ariaLabel: string;
  historique: Publication[] | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const HistoriquePublication = ({
  title,
  ariaLabel,
  historique,
  open,
  onOpenChange,
}: HistoriquePublicationProps) => (
  <Modale
    onOpenChange={onOpenChange}
    open={open}
    title={title}
    trigger={
      <BoutonSousLigné
        aria-label={ariaLabel}
        className="fr-mt-1w fr-ml-3w"
        iconLeft={<Icone className="w-4 h-4 !text-current" icone={Eye1Icon} />}
        type="button"
      >
        Voir l'historique
      </BoutonSousLigné>
    }
  >
    {historique ? (
      historique.map((item, index) => (
        <Fragment key={item.dateModification}>
          {index !== 0 && <hr className="fr-mt-4w" />}
          <AffichagePublication commentaire={item} />
        </Fragment>
      ))
    ) : (
      <p>Chargement de l'historique...</p>
    )}
  </Modale>
);
