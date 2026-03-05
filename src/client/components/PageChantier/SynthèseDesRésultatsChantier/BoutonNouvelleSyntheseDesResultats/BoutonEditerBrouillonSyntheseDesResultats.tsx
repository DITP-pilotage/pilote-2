import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { ModaleEditerBrouillonSyntheseDesResultats } from "./ModaleEditerBrouillonSyntheseDesResultats";

export const BoutonEditerBrouillonSyntheseDesResultats = () => {
  return (
    <ModaleEditerBrouillonSyntheseDesResultats>
      <Bouton
        iconLeft={<Icone className="text-current h-4 w-4" icone={Icone1Icon} />}
        label="Editer un brouillon"
        variant="secondary"
        iconRight={
          <Infobulle classNameIcone="w-5 h-5">
            Vous avez déjà saisi un nouveau commentaire mais vous ne l'avez pas
            publié. Vous pouvez éditer ce nouveau commentaire pour le publier ou
            le conserver en tant que brouillon. Si vous choisissez de publier
            votre nouveau commentaire, le commentaire précédemment affiché sera
            automatiquement archivé dans l'historique des commentaires.
          </Infobulle>
        }
      />
    </ModaleEditerBrouillonSyntheseDesResultats>
  );
};
