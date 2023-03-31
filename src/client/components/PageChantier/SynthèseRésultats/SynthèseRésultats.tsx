import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { SynthèseRésultatsProps } from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultats.interface';
import SynthèseRésultatsStyled from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultats.styled';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import Publication from '@/components/PageChantier/Publication/Publication';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import HistoriqueDeLaSynthèseDesRésultats
  from '@/components/PageChantier/SynthèseRésultats/Historique/HistoriqueDeLaSynthèseDesRésultats';

export default function SynthèseRésultats({ météo, synthèseDesRésultats }: SynthèseRésultatsProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  return (
    <SynthèseRésultatsStyled id="synthèse">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Synthèse des résultats
      </Titre>
      <Bloc titre={territoireSélectionné.nom}>
        <div className='fr-grid-row fr-pt-2w'>
          <div className=" fr-col-12 fr-col-lg-2 conteneur-météo">
            <MétéoBadge météo={météo} />
            <MétéoPicto valeur={météo} />
          </div>
          <div className="fr-col-12 fr-col-lg-10 fr-pl-md-3w">
            {
              synthèseDesRésultats ? (
                <>
                  <Publication
                    auteur={synthèseDesRésultats.auteur}
                    contenu={synthèseDesRésultats.contenu}
                    date={synthèseDesRésultats.date}
                    messageSiAucunContenu="Aucune synthèse des résultats."
                  />
                  <HistoriqueDeLaSynthèseDesRésultats />
                </>
              ) : (
                <p className='fr-text--sm texte-gris'>
                  Aucune synthèse des résultats.
                </p>
              )
            }
          </div>
        </div>
      </Bloc>
    </SynthèseRésultatsStyled>
  );
}
