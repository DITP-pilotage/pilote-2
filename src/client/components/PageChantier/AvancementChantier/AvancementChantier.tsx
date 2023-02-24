import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Avancements from '@/components/_commons/Avancements/Avancements';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementChantierProps from './AvancementChantier.interface';
import AvancementChantierStyled from './AvancementChantier.styled';

export default function AvancementChantier({ avancements }: AvancementChantierProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();

  return (
    <AvancementChantierStyled id="avancement">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Avancement du chantier
      </Titre>
      <div className='fr-grid-row fr-grid-row--gutters'>
        {
          avancements.départementale.moyenne !== undefined &&
          <div className='fr-col-12 fr-col-xl-3 fr-col-md-6'>
            <Bloc titre={territoireSélectionné.nom}>
              <div className='fr-py-4w jauge'>
                <JaugeDeProgression
                  couleur="bleu"
                  libellé={territoireSélectionné.nom}
                  pourcentage={avancements.départementale.moyenne}
                  taille="grande"
                />
              </div>
            </Bloc>
          </div>
        }
        {
          avancements.régionale.moyenne !== undefined && 
          <div className={`${mailleAssociéeAuTerritoireSélectionné === 'régionale' ? 'fr-col-xl-5' : 'fr-col-xl-3'} fr-col-12 fr-col-md-6`}>
            <Bloc titre={territoireSélectionné.territoireParent ? territoireSélectionné.territoireParent.nom : territoireSélectionné.nom}>
              <div className='fr-py-4w jauge'>
                <JaugeDeProgression
                  couleur="bleu"
                  libellé={territoireSélectionné.territoireParent ? territoireSélectionné.territoireParent.nom : territoireSélectionné.nom}
                  pourcentage={avancements.régionale.moyenne}
                  taille="grande"
                />
              </div>
            </Bloc>
          </div>
        }
        <div className='fr-col avancement-national'>
          <Bloc titre='National'>
            <div className='fr-py-4w'>
              <Avancements avancements={avancements.nationale} />
            </div>
          </Bloc>
        </div>
      </div>
    </AvancementChantierStyled>
  );
}
