import { FunctionComponent } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression, {
  BarreDeProgressionVariante,
} from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import {
  JaugeDeProgressionCouleur,
} from '@/client/components/_commons/JaugeDeProgression/JaugeDeProgression.interface';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';

interface AvancementsTerritoireProps {
  territoireNom: string
  avancementGlobal: number | null
  avancementAnnuel: number | null
  jalon: number
  couleurBarreDeProgression: BarreDeProgressionVariante
  couleurJaugeDeProgression: JaugeDeProgressionCouleur
  doitAfficherLeSelecteur: boolean
}

const AvancementsTerritoire: FunctionComponent<AvancementsTerritoireProps> = ({
  territoireNom,
  avancementGlobal,
  avancementAnnuel,
  couleurBarreDeProgression,
  couleurJaugeDeProgression,
  jalon,
  doitAfficherLeSelecteur,
}) => {
  const [, setJalon] = useQueryState('jalon', parseAsStringLiteral(['2024', '2025']).withDefault('2024').withOptions({
    shallow: false,
    history: 'push',
  }));

  const auClickSelecteurJalon = (valeur: '2024' | '2025') => {
    sauvegarderFiltres({ jalon: valeur });
    setJalon(valeur);
  };

  return (
    <>
      <JaugeDeProgression
        couleur={couleurJaugeDeProgression}
        libellé={territoireNom}
        pourcentage={avancementGlobal}
        taille='lg'
      />
      {
        process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' &&
        <div className='fr-mt-2w'>
          <p className='fr-text--xl fr-text--bold fr-mb-0 texte-gris'>
            {`${avancementAnnuel?.toFixed(0) ?? '- '}%`}
          </p>
          <BarreDeProgression
            afficherTexte={false}
            bordure={null}
            fond='gris-clair'
            positionTexte='dessus'
            taille='xxs'
            valeur={avancementAnnuel}
            variante={couleurBarreDeProgression}
          />
          <div className='flex align-center justify-center fr-text--xs'>
            <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
              {`Avancement à échéance${!doitAfficherLeSelecteur ? ` ${jalon}` : ''}`}
            </p>
            {
              doitAfficherLeSelecteur ? (
                <div className='select-sm flex align-center justify-center align-center'>
                  <Sélecteur<'2024' | '2025'>
                    htmlName='jalon'
                    options={[{ libellé: '2024', valeur: '2024' }, { libellé: '2025', valeur: '2025' }]}
                    texteFantôme='Sélectionner un jalon'
                    valeurModifiéeCallback={auClickSelecteurJalon}
                    valeurSélectionnée={`${jalon}` as '2024' | '2025'}
                  />
                  <Infobulle
                    className='fr-pt-0'
                    idHtml='infobulle-selecteur-jalon'
                  >
                    <div>
                      <h5 className='fr-text--sm fr-mb-1w'>
                        Avancement à échéance
                      </h5>
                      <p className='fr-text--xs'>
                        Ce sélecteur vous permet d'afficher les valeurs prises successivement par le taux
                        d'avancement :
                      </p>
                      <ul className='fr-text--xs fr-mb-0'>
                        <li>
                          valeurs observées à la fin des années passées
                        </li>
                        <li>
                          valeur à date (année en cours)
                        </li>
                      </ul>
                    </div>
                  </Infobulle>
                </div>
              ) : null
            }
          </div>
        </div>
      }

    </>
  );
};

export default AvancementsTerritoire;
