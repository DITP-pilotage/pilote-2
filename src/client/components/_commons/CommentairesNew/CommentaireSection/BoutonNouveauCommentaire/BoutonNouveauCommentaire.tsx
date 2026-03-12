import { useState } from "react";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import {
  CommentaireAvecNomsAuteurs,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";
import { libellesTypesCommentaire } from "@/client/constants/libellesCommentaire";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { useNouveauCommentaire } from "./useNouveauCommentaire";
import { ModaleFormulaireCommentaire } from "./ModaleFormulaireCommentaire";

const BoutonNouveauCommentaire = ({
  commentaire,
  type,
  onAction,
}: {
  commentaire: CommentaireAvecNomsAuteurs | null;
  type: TypeCommentaireChantier;
  onAction: (action: CommentaireAction) => void;
}) => {
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();
  const [open, setOpen] = useState(false);
  const refreshRouter = useRefreshRouter();

  const { publier, enregistrerEnBrouillon } = useNouveauCommentaire({
    chantierId: chantier.id,
    territoireCode,
    type,
    onSuccess: (action) => {
      setOpen(false);
      refreshRouter();
      onAction(action);
    },
  });

  return (
    <ModaleFormulaireCommentaire
      commentaire={commentaire}
      onBrouillon={enregistrerEnBrouillon}
      onOpenChange={setOpen}
      onPublier={publier}
      open={open}
      title={`Nouveau commentaire "${libellesTypesCommentaire[type]}"`}
      type={type}
      trigger={
        <Bouton
          iconLeft={
            <Icone className="text-current h-4 w-4" icone={Icone1Icon} />
          }
          iconRight={
            <Infobulle classNameIcone="w-5 h-5">
              Vous pouvez ici saisir un nouveau commentaire et le publier ou
              l'enregistrer en tant que brouillon. Si vous choisissez de publier
              votre nouveau commentaire, le commentaire précédemment affiché
              sera automatiquement archivé dans l'historique des commentaires.
            </Infobulle>
          }
          label="Nouveau commentaire"
          variant="secondary"
        />
      }
    />
  );
};

export default BoutonNouveauCommentaire;
