import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import { SynthèseDesRésultatsProps } from '@/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats.interface';
import SynthèseDesRésultatsStyled from '@/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats.styled';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import SynthèseDesRésultatsHistorique from '@/components/_commons/SynthèseDesRésultats/Historique/Historique';
import useSynthèseDesRésultats from '@/components/_commons/SynthèseDesRésultats/useSynthèseDesRésultats';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SynthèseDesRésultatsAffichage from '@/components/_commons/SynthèseDesRésultats/Affichage/Affichage';
import SynthèseDesRésultatsFormulaire from './Formulaire/Formulaire';

const SynthèseDesRésultats: FunctionComponent<SynthèseDesRésultatsProps> = ({ synthèseDesRésultatsInitiale, rechargerRéforme, réformeId, nomTerritoire, mailleSourceDonnees, modeÉcriture = false, estInteractif = true }) => {  
  const {
    synthèseDesRésultats,
    modeÉdition,
    alerte,
    synthèseDesRésultatsCréée,
    activerLeModeÉdition,
    désactiverLeModeÉdition,
  } = useSynthèseDesRésultats(synthèseDesRésultatsInitiale, rechargerRéforme);

  return (
    <SynthèseDesRésultatsStyled>
      <Bloc titre={nomTerritoire}>
        <div className='fr-py-1w'>
          {
            mailleSourceDonnees === 'régionale' &&
              <Alerte
                classesSupplementaires='fr-mb-4w'
                message='Commentaires facultatifs mais souhaités pour apporter un éclairage départemental au pilotage régional.'
                titre='Données régionales'
                type='info'
              />
          }
          {
            modeÉdition && modeÉcriture ?
              <SynthèseDesRésultatsFormulaire
                annulationCallback={désactiverLeModeÉdition}
                contenuInitial={synthèseDesRésultats?.contenu}
                météoInitiale={synthèseDesRésultats?.météo}
                synthèseDesRésultatsCrééeCallback={synthèseDesRésultatsCréée}
              />
              :
              <>
                {
                  !!alerte &&
                  <div className='fr-mb-2w'>
                    <Alerte
                      titre={alerte.titre}
                      type={alerte.type}
                    />
                  </div>
                }
                <div className='contenu'>
                  <div className='fr-mx-1w fr-mb-2w fr-mb-md-0 météo-affichage'>
                    <div className='fr-mb-2w'>
                      <MétéoBadge météo={synthèseDesRésultats?.météo ?? 'NON_RENSEIGNEE'} />
                    </div>
                    {
                      !!synthèseDesRésultats &&
                      <div>
                        <MétéoPicto météo={synthèseDesRésultats.météo} />
                      </div>
                    }
                  </div>
                  <div className='synthèse-affichage'>
                    <SynthèseDesRésultatsAffichage 
                      synthèseDesRésultats={synthèseDesRésultats} 
                    />
                  </div>
                </div>
                {!!estInteractif && 
                <div className='fr-grid-row fr-grid-row--right'>
                  <div className='fr-col-12 actions fr-mt-1w'>
                    {
                      !!synthèseDesRésultats && <SynthèseDesRésultatsHistorique réformeId={réformeId} />
                      }
                    {
                      !!modeÉcriture &&
                      <button
                        className='fr-btn fr-btn--secondary fr-ml-3w bouton-modifier'
                        onClick={activerLeModeÉdition}
                        type='button'
                      >
                        <span
                          aria-hidden='true'
                          className='fr-icon-edit-line fr-mr-1w'
                        />
                        {}
                        Modifier
                      </button>
                    }
                  </div>
                </div>}
              </>
          }
        </div>
      </Bloc>
    </SynthèseDesRésultatsStyled>
  );
};

export default SynthèseDesRésultats;
