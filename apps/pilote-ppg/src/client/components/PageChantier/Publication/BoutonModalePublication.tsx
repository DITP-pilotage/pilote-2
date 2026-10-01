import { ReactNode, useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/shared/Infobulle";
import {
  FormulairePublicationConfiguration,
  Publication,
  ValeursPublication,
} from "@/components/PageChantier/Publication/Publication.interface";
import { ModaleFormulairePublication } from "@/components/PageChantier/Publication/ModaleFormulairePublication";

export const BoutonModalePublication = <T extends ValeursPublication>({
  avecBrouillon,
  commentaire,
  annexe,
  messageAbsence,
  libelle,
  consigne,
  complementConsigneGenerique,
  formulaire,
  onPublier,
  onEnregistrerBrouillon,
  ariaLabel,
}: {
  avecBrouillon: boolean;
  commentaire: Publication | null;
  annexe?: ReactNode;
  messageAbsence?: string;
  libelle: string;
  consigne: string;
  complementConsigneGenerique: string;
  formulaire: FormulairePublicationConfiguration<T>;
  onPublier: SubmitHandler<T>;
  onEnregistrerBrouillon: SubmitHandler<T>;
  ariaLabel?: string;
}) => {
  const [open, setOpen] = useState(false);

  const handlePublier: SubmitHandler<T> = async (data) => {
    await onPublier(data);
    setOpen(false);
  };

  const handleBrouillon: SubmitHandler<T> = async (data) => {
    await onEnregistrerBrouillon(data);
    setOpen(false);
  };

  return (
    <ModaleFormulairePublication
      annexe={annexe}
      commentaire={commentaire}
      complementConsigneGenerique={complementConsigneGenerique}
      consigne={consigne}
      formulaire={formulaire}
      messageAbsence={messageAbsence}
      onEnregistrerBrouillon={handleBrouillon}
      onOpenChange={setOpen}
      onPublier={handlePublier}
      open={open}
      title={`Nouveau commentaire "${libelle}"`}
      trigger={
        <Bouton
          aria-label={avecBrouillon ? undefined : ariaLabel}
          iconLeft={
            <Icone className="text-current h-4 w-4" icone={Icone1Icon} />
          }
          iconRight={
            <Infobulle classNameIcone="w-5 h-5">
              {avecBrouillon
                ? "Vous avez déjà saisi un nouveau commentaire mais vous ne l'avez pas publié. Vous pouvez éditer ce nouveau commentaire pour le publier ou le conserver en tant que brouillon."
                : "Vous pouvez ici saisir un nouveau commentaire et le publier ou l'enregistrer en tant que brouillon."}{" "}
              Si vous choisissez de publier votre nouveau commentaire, le
              commentaire précédemment affiché sera automatiquement archivé dans
              l'historique des commentaires.
            </Infobulle>
          }
          label={avecBrouillon ? "Editer un brouillon" : "Nouveau commentaire"}
          variant="secondary"
        />
      }
    />
  );
};
