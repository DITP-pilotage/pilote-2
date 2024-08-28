import { FunctionComponent } from 'react';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurSpécificationsStyled from './IndicateurSpécifications.styled';

interface IndicateurSpécificationsProps {
  description: Indicateur['description']
  modeDeCalcul: Indicateur['modeDeCalcul']
  source: Indicateur['source']
  periodicite: Indicateur['periodicite']
  delaiDisponibilite: Indicateur['delaiDisponibilite']
  dateValeurActuelle: string | null
  dateProchaineDateMaj: string | null
  dateProchaineDateValeurActuelle: string | null
  indicateurEstAjour: boolean
  indicateurEstApplicable: boolean | null
}

const IndicateurSpécifications: FunctionComponent<IndicateurSpécificationsProps> = ({
  description,
  modeDeCalcul,
  source,
  periodicite,
  delaiDisponibilite,
  dateProchaineDateMaj,
  dateProchaineDateValeurActuelle,
  dateValeurActuelle,
  indicateurEstAjour,
  indicateurEstApplicable,
}) => {
  const libelléValeurNull = 'Non renseignée';

  return (
    <IndicateurSpécificationsStyled className='fr-px-7w fr-py-2w'>
      <span
        aria-hidden='true'
        className='fr-icon-information-fill fr-ml-n4w fr-mr-1w icone-information'
      />
      <p className='fr-text--md sous-titre'>
        Description de l'indicateur
      </p>
      <p className='fr-text--xs'>
        {description ?? libelléValeurNull}
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Méthode de calcul
      </p>
      <p className='fr-text--xs'>
        {modeDeCalcul ?? libelléValeurNull}
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Source
      </p>
      <p className='fr-text--xs'>
        {source ?? libelléValeurNull}
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Mise à jour
      </p>
      {
        !!!indicateurEstApplicable ? (
          <p className='fr-text--xs'>
            L'indicateur n’est pas applicable sur le territoire
          </p>            
        ) : !!dateProchaineDateMaj ? (
          <>
            <p className='fr-text--xs'>
              La période de mise à jour pour cet indicateur est :
              {' '}
              <span className='fr-text--bold'>
                {periodicite ?? libelléValeurNull}
              </span>
            </p>
            <p className='fr-text--xs'>
              La valeur actuelle de cet indicateur est datée au
              {' '}
              <span className='fr-text--bold'>
                {`${dateValeurActuelle ?? libelléValeurNull}.`}
              </span>
              {' '}
              La prochaine valeur actuelle sera donc datée au
              {' '}
              <span className='fr-text--bold'>
                {`${dateProchaineDateValeurActuelle ?? libelléValeurNull}.`}
              </span>
            </p>
            <p className='fr-text--xs'>
              La mise à disposition d’une nouvelle valeur pour cet indicateur nécessite un délai de disponibilité de
              {' '}
              <span className='fr-text--bold'>
                {delaiDisponibilite ? `${delaiDisponibilite} mois.` : 'Non renseigné'}
              </span>
              {' '}
              {`De ce fait, la mise à jour de la prochaine valeur actuelle est requise ${indicateurEstAjour ? 'au plus tard le' : 'depuis le'}`}
              {' '}
              <span className='fr-text--bold'>
                {`${dateProchaineDateMaj ?? libelléValeurNull}.`}
              </span>
            </p>
          </>
        ) : (
          <>
            {
              !!dateValeurActuelle ? (
                <p className='fr-text--xs'>
                  La période de mise à jour pour cet indicateur et/ou le délai de disponibilité ne sont pas renseignés.
                </p>
              ) : (
                <p className='fr-text--xs'>
                  La valeur actuelle de cet indicateur est non renseignée. De ce fait, la mise à jour de la prochaine valeur actuelle ne peut être calculée.
                </p>                
              )
            }
            <p className='fr-text--xs'>
              De ce fait, la mise à jour de la prochaine valeur actuelle ne peut être calculée.
            </p>
          </>
        )
      }

    </IndicateurSpécificationsStyled>
  );
};

export default IndicateurSpécifications;
