import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import AvancementsTerritoireProps from './AvancementsTerritoire.interface';

export default function AvancementsTerritoire({ territoireNom, avancementGlobal, avancementAnnuel }: AvancementsTerritoireProps) {
  return (
    <>
      <JaugeDeProgression
        couleur='bleu-clair'
        libellé={territoireNom}
        pourcentage={avancementGlobal}
        taille='lg'
      />
      {
        process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' &&
          <div className='fr-mt-2w'>
            <p className='fr-text--xl fr-text--bold fr-mb-0 texte-gris'>
              { `${avancementAnnuel?.toFixed(0) ?? '- '}%` }
            </p>
            <BarreDeProgression
              afficherTexte={false}
              bordure={null}
              fond='gris-clair'
              positionTexte='dessus'
              taille='xxs'
              valeur={avancementAnnuel}
              variante='secondaire'
            />
            <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
              Moyenne de l'année en cours
            </p>
          </div>
      }

    </>
  );
}
