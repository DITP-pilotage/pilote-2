import { Dispatch, SetStateAction } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { wording } from '@/client/utils/i18n/i18n';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import { InformationIndicateurContrat } from '@/server/app/contrats/InformationIndicateurContrat';

const presenterEnFonctionDuSchema = (informationsIndicateur: InformationIndicateurContrat[], valeurSelectionné: string) => {
  const indicateurSelectionné = informationsIndicateur.find(indicateur => indicateur.indicId === valeurSelectionné);
  switch (indicateurSelectionné?.indicSchema) {
    case 'sans-contraintes.json': {
      return 'Pas de contraintes spécifiques supplémentaires.';
    }
    case 'restrict-0-100.json': {
      return 'Les données saisies doivent être comprises entre 0 et 100.';
    }
    case 'restrict-dept.json': {
      return 'Seules des données départementales peuvent être saisies. Les mailles supérieures sont calculées automatiquement par agrégation des valeurs départementales.';
    }
    case 'restrict-reg.json': {
      return 'Seules des données régionales peuvent être saisies. La maille nationale est calculée automatiquement par agrégation des valeurs régionales.';
    }
    default: {
      return 'Pas de contraintes spécifiques supplémentaires.';
    }
  }
};

export function EtapeSelectionIndicateur({
  options,
  valeurModifiéeCallback,
  valeurSélectionnée,
  informationsIndicateur,
}: {
  options: { valeur: string; libellé: string }[],
  valeurModifiéeCallback: Dispatch<SetStateAction<string>>,
  valeurSélectionnée: string,
  informationsIndicateur: InformationIndicateurContrat[],
}) {

  return (
    <div>
      {
        options.length > 0 ?
          <form
            method='GET'
          >
            <Titre baliseHtml='h4'>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.TITRE}
            </Titre>
            <input
              name='etapeCourante'
              type='hidden'
              value={2}
            />
            <Sélecteur
              htmlName='indicateurId'
              libellé="Choix de l'indicateur"
              options={options}
              valeurModifiéeCallback={valeurModifiéeCallback}
              valeurSélectionnée={valeurSélectionnée}
            />
            <p className='fr-mt-3w'>
              <b>
                {`Contraintes de saisie spécifiques à l'indicateur ${valeurSélectionnée} : `}
              </b>
              {presenterEnFonctionDuSchema(informationsIndicateur, valeurSélectionnée)}
            </p>
            <div className='fr-mt-4w flex justify-end'>
              <SubmitBouton
                className='fr-btn--icon-right fr-icon-arrow-right-line'
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
