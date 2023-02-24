import IndicateurÉvolutionProps from '@/components/PageChantier/Indicateurs/Bloc/Détails/Évolution/IndicateurÉvolution.interface';
import Titre from '@/components/_commons/Titre/Titre';

export default function IndicateurÉvolution({ indicateur }: IndicateurÉvolutionProps) {
  return (
    <div>
      <Titre
        baliseHtml='h5'
        className='fr-text--lg fr-mb-0'
      >
        Évolution de l&apos;indicateur
      </Titre>
      <p className="fr-text--xs texte-gris">
        Mis à jour le : Non renseigné | Source : Non renseigné
      </p>
    </div>
  );
}
