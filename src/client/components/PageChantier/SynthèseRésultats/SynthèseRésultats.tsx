import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { SynthèseRésultatsProps } from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultats.interface';
import { récupérerLibelléMétéo, PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import SynthèseRésultatsStyled from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultats.styled';

export default function SynthèseRésultats({ chantier, synthèseDesRésultats }: SynthèseRésultatsProps) {
  const météo = chantier.mailles.nationale.FR.météo;

  return (
    <div id="synthèse">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Synthèse des résultats
      </Titre>
      <Bloc titre="National">
        <div className="fr-container--fluid">
          <SynthèseRésultatsStyled className='fr-grid-row fr-pt-2w'>
            <div className=" fr-col-12 fr-col-lg-2 conteneur-météo">
              <PictoMétéo valeur={météo} />
              <p className='libellé-météo fr-text--sm'>
                {récupérerLibelléMétéo(météo)}
              </p>
            </div>
            <div className="fr-col-12 fr-col-lg-10 fr-pl-md-3w">
              {
                synthèseDesRésultats
                  ?
                    <>
                      <div className="info-mise-a-jour-commentaire fr-text--xs fr-mb-1w">
                        {`Mis à jour le ${synthèseDesRésultats.commentaireSynthèse.date}`}
                      </div>
                      <p className="commentaire fr-text--sm">
                        {synthèseDesRésultats.commentaireSynthèse.contenu.trim() === ''
                          ? 'Le commentaire est vide.'
                          : synthèseDesRésultats.commentaireSynthèse.contenu}
                      </p>
                    </>
                  : null
              }
            </div>
          </SynthèseRésultatsStyled>        
        </div>
      </Bloc>
    </div>
  );
}
