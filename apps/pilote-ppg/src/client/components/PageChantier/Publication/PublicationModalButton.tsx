import { ReactNode, useState } from "react";
import { Button } from "@/components/shared/Button";
import { SubmitHandler } from "react-hook-form";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/shared/Infobulle";
import {
  PublicationFormConfig,
  Publication,
  PublicationValues,
} from "@/components/PageChantier/Publication/Publication.interface";
import { ModaleFormulairePublication } from "@/components/PageChantier/Publication/ModaleFormulairePublication";

export const PublicationModalButton = <T extends PublicationValues>({
  hasDraft,
  commentaire,
  aside,
  emptyMessage,
  libelle,
  consigne,
  complementConsigneGenerique,
  formConfig,
  onPublier,
  onEnregistrerBrouillon,
  ariaLabel,
}: {
  hasDraft: boolean;
  commentaire: Publication | null;
  aside?: ReactNode;
  emptyMessage?: string;
  libelle: string;
  consigne: string;
  complementConsigneGenerique: string;
  formConfig: PublicationFormConfig<T>;
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
      aside={aside}
      commentaire={commentaire}
      complementConsigneGenerique={complementConsigneGenerique}
      consigne={consigne}
      formConfig={formConfig}
      emptyMessage={emptyMessage}
      onEnregistrerBrouillon={handleBrouillon}
      onOpenChange={setOpen}
      onPublier={handlePublier}
      open={open}
      title={`Nouveau commentaire "${libelle}"`}
      trigger={
        <Button
          aria-label={hasDraft ? undefined : ariaLabel}
          iconLeft={
            <Icone className="text-current h-4 w-4" icone={Icone1Icon} />
          }
          addon={
            <Infobulle classNameIcone="w-5 h-5">
              {hasDraft
                ? "Vous avez déjà saisi un nouveau commentaire mais vous ne l'avez pas publié. Vous pouvez éditer ce nouveau commentaire pour le publier ou le conserver en tant que brouillon."
                : "Vous pouvez ici saisir un nouveau commentaire et le publier ou l'enregistrer en tant que brouillon."}{" "}
              Si vous choisissez de publier votre nouveau commentaire, le
              commentaire précédemment affiché sera automatiquement archivé dans
              l'historique des commentaires.
            </Infobulle>
          }
          variant="secondary"
        >
          {hasDraft ? "Editer un brouillon" : "Nouveau commentaire"}
        </Button>
      }
    />
  );
};
