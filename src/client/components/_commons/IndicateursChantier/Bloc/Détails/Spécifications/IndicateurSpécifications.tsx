import IndicateurSpécificationsProps
  from '@/components/_commons/IndicateursChantier/Bloc/Détails/Spécifications/IndicateurSpécifications.interface';
import IndicateurSpécificationsStyled from './IndicateurSpécifications.styled';

export default function IndicateurSpécifications({
  description,
  modeDeCalcul,
  source,
  periodicite,
  delaiDisponibilite,
  dateProchaineDateMaj,
  dateProchaineDateValeurActuelle,
  dateValeurActuelle,
}: IndicateurSpécificationsProps) {
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
        !!dateProchaineDateMaj ? (
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
              De ce fait, la mise à jour de la prochaine valeur actuelle est requise au plus tard le
              {' '}
              <span className='fr-text--bold'>
                {`${dateProchaineDateMaj ?? libelléValeurNull}.`}
              </span>
            </p>
          </>
        ) : (
          <>
            <p className='fr-text--xs'>
              La période de mise à jour pour cet indicateur et/ou le délai de disponibilité ne sont pas renseignés.
            </p>
            <p className='fr-text--xs'>
              De ce fait, la mise à jour de la prochaine valeur actuelle ne peut être calculée.
            </p>
          </>
        )
      }

    </IndicateurSpécificationsStyled>
  );
}
