import { FunctionComponent } from 'react';
import { FicheConducteurContrat } from '@/server/fiche-conducteur/app/contrats/FicheConducteurContrat';
import PageFicheTerritorialeStyled from '@/components/PageFicheTerritoriale/PageFicheTerritoriale.styled';
import Titre from '@/components/_commons/Titre/Titre';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';
import Encart from '@/components/_commons/Encart/Encart';

export const
  PageFicheConducteur: FunctionComponent<{
    ficheConducteur: FicheConducteurContrat
  }> = ({ ficheConducteur }) => {
    return (
      <PageFicheTerritorialeStyled>
        <main>
          <div className='fr-container fr-pb-2w fiche-conducteur__container'>
            <Encart>
              <div className='flex justify-between'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-0 fr-text-title--blue-france'
                >
                  Fiche conducteur national : CH-168
                </Titre>
                <div className='flex justify-end'>
                  <BoutonImpression />
                </div>
              </div>
            </Encart>
          </div>
        </main>
      </PageFicheTerritorialeStyled>
    );
  };
