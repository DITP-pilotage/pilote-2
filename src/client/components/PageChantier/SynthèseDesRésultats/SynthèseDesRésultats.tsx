import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { SynthèseDesRésultatsProps } from '@/components/PageChantier/SynthèseDesRésultats/SynthèseDesRésultats.interface';
import SynthèseDesRésultatsStyled from '@/components/PageChantier/SynthèseDesRésultats/SynthèseDesRésultats.styled';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import HistoriqueDeLaSynthèseDesRésultats from '@/components/PageChantier/SynthèseDesRésultats/SynthèseDesRésultatsHistorique/SynthèseDesRésultatsHistorique';
import useSynthèseDesRésultats from '@/components/PageChantier/SynthèseDesRésultats/useSynthèseDesRésultats';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SynthèseDesRésultatsAffichage from '@/components/PageChantier/SynthèseDesRésultats/SynthèseDesRésultatsAffichage/SynthèseDesRésultatsAffichage';
import SynthèseDesRésultatsFormulaire from './SynthèseDesRésultatsFormulaire/SynthèseDesRésultatsFormulaire';

export default function SynthèseDesRésultats({ synthèseDesRésultatsInitiale, rechargerChantier, chantierId, modeÉcriture = false, estInteractif = true }: SynthèseDesRésultatsProps) {
  const {
    synthèseDesRésultats,
    nomTerritoireSélectionné,
    modeÉdition,
    alerte,
    synthèseDesRésultatsCréée,
    activerLeModeÉdition,
    désactiverLeModeÉdition,
  } = useSynthèseDesRésultats(synthèseDesRésultatsInitiale, rechargerChantier);

  return (
    <SynthèseDesRésultatsStyled id="synthèse">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Météo et synthèse des résultats 
      </Titre>
      <Bloc titre={nomTerritoireSélectionné}>
        <div className='fr-px-1w fr-py-2w'>
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
                <div className="conteneur">
                  <div className="conteneur-météo fr-mb-3w fr-mb-md-0">
                    <MétéoBadge météo={synthèseDesRésultats?.météo ?? 'NON_RENSEIGNEE'} />
                    {
                      !!synthèseDesRésultats &&
                      <div>
                        <MétéoPicto météo={synthèseDesRésultats.météo} />
                      </div>
                    }
                  </div>
                  <div className="fr-pl-md-3w">
                    <SynthèseDesRésultatsAffichage synthèseDesRésultats={synthèseDesRésultats} />
                  </div>
                </div>
                {!!estInteractif && 
                <div className='fr-grid-row fr-grid-row--right'>
                  <div className='fr-col-12 actions fr-mt-1w'>
                    {
                      !!synthèseDesRésultats && <HistoriqueDeLaSynthèseDesRésultats chantierId={chantierId} />
                      }
                    {
                      !!modeÉcriture &&
                      <button
                        className='fr-btn fr-btn--secondary fr-ml-3w bouton-modifier'
                        onClick={activerLeModeÉdition}
                        type='button'
                      >
                        <span
                          aria-hidden="true"
                          className="fr-icon-edit-line fr-mr-1w"
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
}
