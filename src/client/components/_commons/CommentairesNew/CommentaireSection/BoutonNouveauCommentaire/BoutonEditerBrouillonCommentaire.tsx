import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";
import {
  BrouillonPublication,
  PublicationAvecAuteur,
} from "@/components/_commons/CommentairesNew/CommentaireSection/Publication.interface";
import { ModaleFormulaireCommentaire } from "./ModaleFormulaireCommentaire";

const BoutonEditerBrouillonCommentaire = ({
  commentaire,
  brouillon,
  libelle,
  consigne,
  onPublier,
  onBrouillon,
  onAction,
}: {
  commentaire: PublicationAvecAuteur | null;
  brouillon: BrouillonPublication | null;
  libelle: string;
  consigne: string;
  onPublier: SubmitHandler<{ contenu: string }>;
  onBrouillon: SubmitHandler<{ contenu: string }>;
  onAction: (action: CommentaireAction) => void;
}) => {
  const [open, setOpen] = useState(false);

  const handlePublier: SubmitHandler<{ contenu: string }> = async (data) => {
    await onPublier(data);
    setOpen(false);
    onAction("publication-reussie");
  };

  const handleBrouillon: SubmitHandler<{ contenu: string }> = async (data) => {
    await onBrouillon(data);
    setOpen(false);
    onAction("brouillon-enregistre");
  };

  return (
    <ModaleFormulaireCommentaire
      brouillon={brouillon}
      commentaire={commentaire}
      consigne={consigne}
      libelle={libelle}
      onBrouillon={handleBrouillon}
      onOpenChange={setOpen}
      onPublier={handlePublier}
      open={open}
      title={`Nouveau commentaire "${libelle}"`}
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
