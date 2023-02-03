import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import EnTête from '@/components/_commons/Bloc/EnTête/EnTête';
import { SynthèseRésultatsProps } from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultatsProps';
import { récupérerLibelléMétéo, PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import SynthèseRésultatsStyled from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultats.styled';

export default function SynthèseRésultats({ chantier, synthèseDesRésultats }: SynthèseRésultatsProps) {
  const météo = chantier.mailles.nationale.FR.météo;

  return (
    <div id="synthèse">
      <Titre baliseHtml='h2'>
        Synthèse des résultats
      </Titre>
      <Bloc>
        <EnTête libellé='National' />
        <div className="fr-container--fluid">
          <SynthèseRésultatsStyled className='fr-grid-row fr-pt-2w'>
            <div className=" fr-col-12 fr-col-lg-2 conteneur-météo">
              <PictoMétéo
                valeur={météo}
              />
              <p className='libellé-météo fr-text--sm'>
                {récupérerLibelléMétéo(météo)}
              </p>
            </div>
            <div className="fr-col-12 fr-col-lg-10 fr-pl-md-3w">
              <div className="info-mise-a-jour-commentaire fr-text--sm fr-mb-1w">
                {`Mis à jour le ${synthèseDesRésultats.commentaireSynthèse.date}`}
              </div>
              <p className="commentaire">
                {synthèseDesRésultats.commentaireSynthèse.contenu}
              </p>
            </div>
          </SynthèseRésultatsStyled>        
        </div>
      </Bloc>
    </div>
  );
}
