import { Dispatch, SetStateAction } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { wording } from '@/client/utils/i18n/i18n';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';

export function EtapeSelectionIndicateur({
  options,
  valeurModifiéeCallback,
  valeurSélectionnée,
}: {
  options: { valeur: string; libellé: string }[],
  valeurModifiéeCallback: Dispatch<SetStateAction<string>>,
  valeurSélectionnée: string
}) {
  return (
    <div>
      {
        options.length > 0 ?
          <form
            method="GET"
          >
            <Titre baliseHtml="h4">
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.TITRE}
            </Titre>
            <input
              name="etapeCourante"
              type="hidden"
              value={2}
            />
            <Sélecteur
              htmlName="indicateurId"
              libellé="Choix de l’indicateur"
              options={options}
              valeurModifiéeCallback={valeurModifiéeCallback}
              valeurSélectionnée={valeurSélectionnée}
            />
            <div className="fr-mt-4w flex justify-end">
              <SubmitBouton
                className="fr-btn--icon-right fr-icon-arrow-right-line"
                label={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.LABEL_BOUTON_PROCHAINE_ETAPE}
              />
            </div>
          </form>
          :
          <div>
            {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.MESSAGE_ERREUR_AUCUN_INDICATEUR}
          </div>
      }
    </div>
  );
}
