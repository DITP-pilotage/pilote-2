import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { SynthèseDesRésultatsProps } from '@/components/PageChantier/SynthèseDesRésultats/SynthèseDesRésultats.interface';
import SynthèseDesRésultatsStyled from '@/components/PageChantier/SynthèseDesRésultats/SynthèseDesRésultats.styled';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import Publication from '@/components/PageChantier/Publication/Publication';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import HistoriqueDeLaSynthèseDesRésultats
  from '@/components/PageChantier/SynthèseDesRésultats/Historique/HistoriqueDeLaSynthèseDesRésultats';
import useSynthèseDesRésultats from '@/components/PageChantier/SynthèseDesRésultats/useSynthèseDesRésultats';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SynthèseDesRésultatsFormulaire from './SynthèseDesRésultatsFormulaire/SynthèseDesRésultatsFormulaire';

export default function SynthèseDesRésultats({ synthèseDesRésultatsInitiale }: SynthèseDesRésultatsProps) {
  const {
    synthèseDesRésultats,
    nomTerritoireSélectionné,
    modeÉdition,
    alerte,
    synthèseDesRésultatsCréée,
    activerLeModeÉdition,
    désactiverLeModeÉdition,
  } = useSynthèseDesRésultats(synthèseDesRésultatsInitiale);

  return (
    <SynthèseDesRésultatsStyled id="synthèse">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Météo et synthèse des résultats 
      </Titre>
      <Bloc titre={nomTerritoireSélectionné}>
        <div className='fr-px-1w'>
          {
            modeÉdition ?
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
                    <Alerte
                      message={alerte.message}
                      type={alerte.type}
                    />
                }
                <div className="fr-grid-row fr-py-2w">
                  <div className=" fr-col-12 fr-col-lg-2 conteneur-météo">
                    <MétéoBadge météo={synthèseDesRésultats?.météo ?? 'NON_RENSEIGNEE'} />
                    {
                      !!synthèseDesRésultats &&
                      <div>
                        <MétéoPicto météo={synthèseDesRésultats.météo} />
                      </div>
                    }
                  </div>
                  <div className="fr-col-12 fr-col-lg-10 fr-pl-md-3w">
                    {
                      synthèseDesRésultats
                        ?
                          <Publication
                            auteur={synthèseDesRésultats.auteur}
                            contenu={synthèseDesRésultats.contenu}
                            date={synthèseDesRésultats.date}
                            messageSiAucunContenu="Aucune synthèse des résultats."
                          />
                        :
                          <p className='fr-text--sm texte-gris'>
                            Aucune synthèse des résultats.
                          </p>
                    }
                    <div className='actions fr-mt-4w'>
                      {
                        !!synthèseDesRésultats && <HistoriqueDeLaSynthèseDesRésultats />
                      }
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
                    </div>
                  </div>
                </div>
              </>
          }
        </div>
      </Bloc>
    </SynthèseDesRésultatsStyled>
  );
}
