import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { SynthèseRésultatsProps } from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultats.interface';
import SynthèseRésultatsStyled from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultats.styled';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import météos from '@/client/constants/météos';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import Publication from '@/components/PageChantier/Publication/Publication';

export default function SynthèseRésultats({ météo, synthèseDesRésultats }: SynthèseRésultatsProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  return (
    <section id="synthèse">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Synthèse des résultats
      </Titre>
      <Bloc titre={territoireSélectionné.nom}>
        <SynthèseRésultatsStyled className='fr-grid-row fr-pt-2w'>
          <div className=" fr-col-12 fr-col-lg-2 conteneur-météo">
            <p className='libellé-météo fr-text--sm'>
              {météos[météo]}
            </p>
            <PictoMétéo valeur={météo} />
          </div>
          <div className="fr-col-12 fr-col-lg-10 fr-pl-md-3w">
            <Publication
              auteur={synthèseDesRésultats?.auteur ?? null}
              contenu={synthèseDesRésultats?.contenu ?? null}
              date={synthèseDesRésultats?.date ?? null}
              messageSiAucunContenu="Aucune synthèse des résultats."
            />
          </div>
        </SynthèseRésultatsStyled>
      </Bloc>
    </section>
  );
}
