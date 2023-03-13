import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { SynthèseRésultatsProps } from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultats.interface';
import SynthèseRésultatsStyled from '@/components/PageChantier/SynthèseRésultats/SynthèseRésultats.styled';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import météos from '@/client/constants/météos';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';

export default function SynthèseRésultats({ météo, synthèseDesRésultats }: SynthèseRésultatsProps) {
  return (
    <section id="synthèse">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Synthèse des résultats
      </Titre>
      <Bloc titre="National">
        <SynthèseRésultatsStyled className='fr-grid-row fr-pt-2w'>
          <div className=" fr-col-12 fr-col-lg-2 conteneur-météo">
            <p className='libellé-météo fr-text--sm'>
              {météos[météo]}
            </p>
            <PictoMétéo valeur={météo} />
          </div>
          <div className="fr-col-12 fr-col-lg-10 fr-pl-md-3w">
            {
                synthèseDesRésultats && synthèseDesRésultats?.contenu?.trim() !== ''
                  ?
                    <>
                      <p className="texte-gris fr-text--xs fr-mb-1w">
                        {`Mis à jour le ${formaterDate(synthèseDesRésultats.date, 'jj/mm/aaaa')}`}
                      </p>
                      <p
                        className="fr-text--sm"  
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{
                          __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(synthèseDesRésultats.contenu),
                        }}
                      />
                    </>
                  : 'Aucune synthèse des résultats.'
              }
          </div>
        </SynthèseRésultatsStyled>
      </Bloc>
    </section>
  );
}
