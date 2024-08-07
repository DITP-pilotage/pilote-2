import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import {
  SynthèseDesRésultatsProps,
} from '@/components/_commons/SynthèseDesRésultatsNew/SynthèseDesRésultats.interface';
import SynthèseDesRésultatsStyled from '@/components/_commons/SynthèseDesRésultatsNew/SynthèseDesRésultats.styled';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import SynthèseDesRésultatsHistorique from '@/components/_commons/SynthèseDesRésultatsNew/Historique/Historique';
import { useSynthèseDesRésultats } from '@/components/_commons/SynthèseDesRésultatsNew/useSynthèseDesRésultats';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SynthèseDesRésultatsAffichage from '@/components/_commons/SynthèseDesRésultatsNew/Affichage/Affichage';
import SynthèseDesRésultatsFormulaire from './Formulaire/Formulaire';

const SynthèseDesRésultats: FunctionComponent<SynthèseDesRésultatsProps> = ({
  synthèseDesRésultatsInitiale,
  réformeId,
  nomTerritoire,
  modeÉcriture = false,
  estInteractif = true,
}) => {
  const [action] = useQueryState('_action', parseAsStringLiteral(['creation-reussie', '']));
  const [modeÉdition, setModeÉdition] = useQueryState('edition', parseAsBoolean.withDefault(false).withOptions({
    history: 'push',
    shallow: false,
    clearOnDefault: true,
  }));

  const {
    synthèseDesRésultatsCréée,
  } = useSynthèseDesRésultats();

  return (
    <SynthèseDesRésultatsStyled>
      <Bloc titre={nomTerritoire}>
        <div className='fr-py-1w'>
          {
            modeÉdition && modeÉcriture ?
              <SynthèseDesRésultatsFormulaire
                annulationCallback={() => setModeÉdition(false)}
                contenuInitial={synthèseDesRésultatsInitiale?.contenu}
                météoInitiale={synthèseDesRésultatsInitiale?.météo}
                synthèseDesRésultatsCrééeCallback={synthèseDesRésultatsCréée}
              />
              :
              <>
                {
                  action === 'creation-reussie' &&
                  <div className='fr-mb-2w'>
                    <Alerte
                      titre='Météo et synthèse des résultats publiées'
                      type='succès'
                    />
                  </div>
                }
                <div className='contenu'>
                  <div className='fr-mx-1w fr-mb-2w fr-mb-md-0 météo-affichage'>
                    <div className='fr-mb-2w'>
                      <MétéoBadge météo={synthèseDesRésultatsInitiale?.météo ?? 'NON_RENSEIGNEE'} />
                    </div>
                    {
                      !!synthèseDesRésultatsInitiale &&
                      <div>
                        <MétéoPicto météo={synthèseDesRésultatsInitiale.météo} />
                      </div>
                    }
                  </div>
                  <div className='synthèse-affichage'>
                    <SynthèseDesRésultatsAffichage
                      synthèseDesRésultats={synthèseDesRésultatsInitiale}
                    />
                  </div>
                </div>
                {
                  estInteractif ? (
                    <div className='fr-grid-row fr-grid-row--right'>
                      <div className='fr-col-12 actions fr-mt-1w'>
                        {
                          !!synthèseDesRésultatsInitiale && <SynthèseDesRésultatsHistorique réformeId={réformeId} />
                        }
                        {
                          modeÉcriture ? (
                            <button
                              className='fr-btn fr-btn--secondary fr-ml-3w bouton-modifier'
                              onClick={() => setModeÉdition(true)}
                              type='button'
                            >
                              <span
                                aria-hidden='true'
                                className='fr-icon-edit-line fr-mr-1w'
                              />
                              {}
                              Modifier
                            </button>
                          ) : null
                        }
                      </div>
                    </div>
                  ) : null
}
              </>
          }
        </div>
      </Bloc>
    </SynthèseDesRésultatsStyled>
  );
};

export default SynthèseDesRésultats;
