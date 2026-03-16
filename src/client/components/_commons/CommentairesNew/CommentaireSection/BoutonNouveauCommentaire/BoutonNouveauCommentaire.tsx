import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";
import { PublicationAvecAuteur } from "@/components/_commons/CommentairesNew/CommentaireSection/Publication.interface";
import { ModaleFormulaireCommentaire } from "./ModaleFormulaireCommentaire";

const BoutonNouveauCommentaire = ({
  commentaire,
  libelle,
  consigne,
  onPublier,
  onBrouillon,
  onAction,
}: {
  commentaire: PublicationAvecAuteur | null;
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
              Vous pouvez ici saisir un nouveau commentaire et le publier ou
              l'enregistrer en tant que brouillon. Si vous choisissez de publier
              votre nouveau commentaire, le commentaire précédemment affiché
              sera automatiquement archivé dans l'historique des commentaires.
            </Infobulle>
          }
          aria-label={`bouton-nouveau-commentaire-${libelle}`}
          label="Nouveau commentaire"
          variant="secondary"
        />
      }
    />
  );
};

export default BoutonNouveauCommentaire;
