import 'dsfr-chart/MultiLineChart/multiline-chart.css';
import Script from 'next/script';
import IndicateurÉvolutionProps from '@/components/PageChantier/Indicateurs/CarteIndicateur/IndicateurÉvolution/IndicateurÉvolution.interface';

export default function IndicateurVolution({ indicateur }: IndicateurÉvolutionProps) {
  return (
    <>
      <Script
        src="/js/dsfr-chart/MultiLineChart/multiline-chart.umd.min.js"
      />
      <div className="fr-mb-8w">
        <multiline-chart
          hline={JSON.stringify([indicateur.valeurCible])}
          hlinecolor={JSON.stringify(['#FC5D00'])}
          hlinename={JSON.stringify(['Cible'])}
          name={JSON.stringify(['National'])}
          x={JSON.stringify([indicateur.evolutionDateValeurActuelle])} //TODO utiliser formaterDate après merge de #173
          y={JSON.stringify([indicateur.evolutionValeurActuelle])}
        />
      </div>
    </>
  );
}
