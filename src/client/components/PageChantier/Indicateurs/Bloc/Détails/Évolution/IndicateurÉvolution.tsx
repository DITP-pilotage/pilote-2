import 'dsfr-chart/MultiLineChart/multiline-chart.css';
import Script from 'next/script';
import IndicateurÉvolutionProps from '@/components/PageChantier/Indicateurs/Bloc/Détails/Évolution/IndicateurÉvolution.interface';
import Titre from '@/components/_commons/Titre/Titre';

export default function IndicateurÉvolution({ indicateur }: IndicateurÉvolutionProps) {
  return (
    <>
      <Script
        src="/js/dsfr-chart/MultiLineChart/multiline-chart.umd.min.js"
      />
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
        <multiline-chart
          hline={JSON.stringify([indicateur.mailles.nationale.FR.valeurCible])}
          hlinecolor={JSON.stringify(['#FC5D00'])}
          hlinename={JSON.stringify(['Cible'])}
          name={JSON.stringify(['National'])}
          x={JSON.stringify([indicateur.mailles.nationale.FR.evolutionDateValeurActuelle])} //TODO utiliser formaterDate après merge de #173
          y={JSON.stringify([indicateur.mailles.nationale.FR.evolutionValeurActuelle])}
        />
      </div>
    </>
  );
}
