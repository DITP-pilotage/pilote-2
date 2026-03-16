import { Fragment, useState } from "react";
import { Modale } from "@/components/shared/Modale";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Icone } from "@/components/_commons/Icone";
import { Eye1Icon } from "@/components/_commons/Icones/Eye1Icon";
import api from "@/server/infrastructure/api/trpc/api";
import AffichageCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Affichage/Affichage";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";

const HistoriqueDecisionStrategique = () => {
  const [open, setOpen] = useState(false);
  const { chantier } = pageChantier.useServerSidePropsContext();

  const { data: historique } =
    api.decisionStrategique.recupererHistorique.useQuery(
      { chantierId: chantier.id, type: "suiviDesDécisionsStratégiques" },
      { enabled: open },
    );

  return (
    <Modale
      onOpenChange={setOpen}
      open={open}
      title="Historique - Décisions stratégiques"
      trigger={
        <BoutonSousLigné
          aria-label="Voir l'historique des décisions stratégiques"
          className="fr-mt-1w fr-ml-3w"
          iconLeft={
            <Icone className="w-4 h-4 !text-current" icone={Eye1Icon} />
          }
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
            <AffichageCommentaire commentaire={item} />
          </Fragment>
        ))
      ) : (
        <p>Chargement de l'historique...</p>
      )}
    </Modale>
  );
};

export default HistoriqueDecisionStrategique;
