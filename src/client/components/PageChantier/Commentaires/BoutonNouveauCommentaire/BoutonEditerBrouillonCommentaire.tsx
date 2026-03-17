import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import {
  PublicationBrouillon,
  Publication,
} from "@/components/PageChantier/Publication/Publication.interface";
import { ModaleFormulairePublication } from "@/components/PageChantier/Publication/Formulaire/ModaleFormulairePublication";

const BoutonEditerBrouillonCommentaire = ({
  commentaire,
  brouillon,
  libelle,
  consigne,
  onPublier,
  onEnregistrerBrouillon,
}: {
  commentaire: Publication | null;
  brouillon: PublicationBrouillon | null;
  libelle: string;
  consigne: string;
  onPublier: SubmitHandler<{ contenu: string }>;
  onEnregistrerBrouillon: SubmitHandler<{ contenu: string }>;
}) => {
  const [open, setOpen] = useState(false);

  const handlePublier: SubmitHandler<{ contenu: string }> = async (data) => {
    await onPublier(data);
    setOpen(false);
  };

  const handleBrouillon: SubmitHandler<{ contenu: string }> = async (data) => {
    await onEnregistrerBrouillon(data);
    setOpen(false);
  };

  return (
    <ModaleFormulairePublication
      brouillon={brouillon}
      commentaire={commentaire}
      consigne={consigne}
      libelle={libelle}
      onEnregistrerBrouillon={handleBrouillon}
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
