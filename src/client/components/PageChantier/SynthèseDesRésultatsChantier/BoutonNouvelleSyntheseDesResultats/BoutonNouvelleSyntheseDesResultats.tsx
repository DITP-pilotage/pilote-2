import { useState } from "react";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { SyntheseDesResultatsAction } from "@/components/PageChantier/SynthèseDesRésultatsChantier/AlerteSyntheseDesResultats";
import { useNouvelleSyntheseDesResultats } from "./useNouvelleSyntheseDesResultats";
import { ModaleFormulaireSyntheseDesResultats } from "./ModaleFormulaireSyntheseDesResultats";

export const BoutonNouvelleSyntheseDesResultats = ({
  onAction,
}: {
  onAction: (action: SyntheseDesResultatsAction) => void;
}) => {
  const [open, setOpen] = useState(false);
  const refreshRouter = useRefreshRouter();
  const { publier, enregistrerEnBrouillon } = useNouvelleSyntheseDesResultats({
    onAction,
    onSuccess: () => {
      setOpen(false);
      refreshRouter();
    },
  });

  return (
    <ModaleFormulaireSyntheseDesResultats
      onBrouillon={enregistrerEnBrouillon}
      onOpenChange={setOpen}
      onPublier={publier}
      open={open}
      title="Nouveau commentaire"
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
