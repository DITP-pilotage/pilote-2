import IndicateurSpécificationsProps from '@/components/_commons/Indicateurs/Bloc/Détails/Spécifications/IndicateurSpécifications.interface';
import IndicateurSpécificationsStyled from './IndicateurSpécifications.styled';

export default function IndicateurSpécifications({ description,  modeDeCalcul, source } : IndicateurSpécificationsProps) {
  const libelléValeurNull = 'Non renseignée';

  return (
    <IndicateurSpécificationsStyled className='fr-px-7w fr-py-2w'>
      <span
        aria-hidden="true"
        className="fr-icon-information-fill fr-ml-n4w fr-mr-1w icone-information"
      />
      <p className='fr-text--md sous-titre'>
        Description de l&apos;indicateur
      </p>
      <p className='fr-text--xs'>
        { description ?? libelléValeurNull }
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Méthode de calcul
      </p>
      <p className='fr-text--xs'>
        { modeDeCalcul ?? libelléValeurNull }
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Source
      </p>
      <p className='fr-text--xs'>
        { source ?? libelléValeurNull }
      </p>
    </IndicateurSpécificationsStyled>
  );
}
