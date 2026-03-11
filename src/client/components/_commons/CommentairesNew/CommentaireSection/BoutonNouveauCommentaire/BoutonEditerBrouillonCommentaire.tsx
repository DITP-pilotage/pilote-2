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
import api from "@/server/infrastructure/api/trpc/api";
import { useEditerBrouillonCommentaire } from "./useEditerBrouillonCommentaire";
import { ModaleFormulaireCommentaire } from "./ModaleFormulaireCommentaire";

const BoutonEditerBrouillonCommentaire = ({
  commentaire,
  réformeId,
  territoireCode,
  type,
}: {
  commentaire: CommentaireAvecNomsAuteurs | null;
  réformeId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
}) => {
  const [open, setOpen] = useState(false);
  const refreshRouter = useRefreshRouter();

  const { data: brouillon } =
    api.commentaire.recupererDernierBrouillon.useQuery(
      { réformeId, territoireCode, type },
      { enabled: open },
    );

  const { publier, enregistrerEnBrouillon } = useEditerBrouillonCommentaire({
    brouillon: brouillon!,
    type,
    onSuccess: () => {
      setOpen(false);
      refreshRouter();
    },
  });

  return (
    <ModaleFormulaireCommentaire
      brouillon={brouillon}
      commentaire={commentaire}
      onBrouillon={enregistrerEnBrouillon}
      onOpenChange={setOpen}
      onPublier={publier}
      open={open}
      title="Editer un brouillon"
      trigger={
        <Bouton
          iconLeft={
            <Icone className="text-current h-4 w-4" icone={Icone1Icon} />
          }
          iconRight={
            <Infobulle classNameIcone="w-5 h-5">
              Vous avez déjà saisi un nouveau commentaire mais vous ne l'avez
              pas publié. Vous pouvez éditer ce nouveau commentaire pour le
              publier ou le conserver en tant que brouillon.
            </Infobulle>
          }
          label="Editer un brouillon"
          variant="secondary"
        />
      }
    />
  );
};

export default BoutonEditerBrouillonCommentaire;
