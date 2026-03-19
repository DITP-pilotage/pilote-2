import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { Publication } from "@/components/PageChantier/PublicationV2/Publication.interface";
import { ModaleFormulairePublication } from "@/components/PageChantier/PublicationV2/ModaleFormulairePublication";

export const BoutonNouvellePublication = ({
  commentaire,
  libelle,
  consigne,
  complementConsigneGenerique,
  onPublier,
  onEnregistrerBrouillon,
  ariaLabel,
}: {
  commentaire: Publication | null;
  libelle: string;
  consigne: string;
  complementConsigneGenerique: string;
  onPublier: SubmitHandler<{ contenu: string }>;
  onEnregistrerBrouillon: SubmitHandler<{ contenu: string }>;
  ariaLabel: string;
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
      commentaire={commentaire}
      complementConsigneGenerique={complementConsigneGenerique}
      consigne={consigne}
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
              Vous pouvez ici saisir un nouveau commentaire et le publier ou
              l'enregistrer en tant que brouillon. Si vous choisissez de publier
              votre nouveau commentaire, le commentaire précédemment affiché
              sera automatiquement archivé dans l'historique des commentaires.
            </Infobulle>
          }
          aria-label={ariaLabel}
          label="Nouveau commentaire"
          variant="secondary"
        />
      }
    />
  );
};
