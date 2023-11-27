import { useState } from 'react';
import Titre from '@/client/components/_commons/Titre/Titre';
import FiltresActifs from '@/components/PageAccueil/FiltresActifs/FiltresActifs';
import Bloc from '@/client/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_PROJETS_STRUCTURANTS } from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import RépartitionMétéo from '@/components/_commons/RépartitionMétéo/RépartitionMétéo';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import usePageProjetsStructurants from './usePageProjetsStructurants';
import PageProjetsStructurantsProps from './PageProjetsStructurants.interface';
import TableauProjetsStructurants from './TableauProjetsStructurants/TableauProjetsStructurants';

export default function PageProjetsStructurants({ projetsStructurants, ministères }: PageProjetsStructurantsProps) {
  const {
    projetsDuTerritoireSélectionnéEtTerritoiresEnfants,
    nombreFiltresActifs,
    donnéesCartographieAvancement,
    donnéesAvancementMoyen,
    répartitionMétéos,
  } = usePageProjetsStructurants(projetsStructurants);  
  
  const { auClicTerritoireCallback } = useCartographie();
  const [nombreProjetsStructurantsDansLeTableau, setNombreProjetsStructurantsDansLeTableau] = useState<number>();
  
  const nombreDeProjets = projetsDuTerritoireSélectionnéEtTerritoiresEnfants.length;

  return (
    <main>
      {
        nombreFiltresActifs > 0 &&
        <FiltresActifs ministères={ministères} />
      }
      <div className='fr-py-2w fr-px-md-2w fr-container--fluid'>
        <div className='fr-px-2w fr-px-md-0 flex justify-between'>

          <Titre
            baliseHtml='h1'
            className='fr-h4'
          >
            {`${nombreDeProjets} ${nombreDeProjets > 1 ? 'projets' : 'projet'}`}
          </Titre>
        </div>
        <div className='fr-grid-row fr-grid-row--gutters'>
          <div className='fr-col-12 fr-col-lg-6'>
            <Bloc>
              <section>
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml='h2'
                    className='fr-text--lg fr-mb-0 fr-py-1v'
                    estInline
                  >
                    Taux d’avancement moyen
                  </Titre>
                  <Infobulle idHtml='infobulle-projetsStructurants-avancements'>
                    {INFOBULLE_CONTENUS.projetsStructurants.jauges}
                  </Infobulle>
                </TitreInfobulleConteneur>
                <div className='fr-grid-row fr-grid-row--center'>
                  <JaugeDeProgression
                    couleur='rose'
                    libellé="Taux d'avancement global"
                    pourcentage={donnéesAvancementMoyen}
                    taille='lg'
                  />
                </div>
              </section>
              <hr className='fr-hr fr-my-3w fr-pb-1v' />
              <section>
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml='h2'
                    className='fr-text--lg fr-mb-0 fr-py-1v'
                    estInline
                  >
                    Répartition des météos renseignées
                  </Titre>
                  <Infobulle idHtml='infobulle-projetsStructurants-météos'>
                    {INFOBULLE_CONTENUS.projetsStructurants.météos}
                  </Infobulle>
                </TitreInfobulleConteneur>
                <RépartitionMétéo météos={répartitionMétéos} />
              </section>
            </Bloc>
          </div>
          <div className='fr-col-12 fr-col-lg-6'>
            <Bloc>
              <section>
                <Titre
                  baliseHtml='h2'
                  className='fr-text--lg'
                >
                  Taux d’avancement des projets structurants par territoire
                </Titre>
                <CartographieAvancement
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={donnéesCartographieAvancement}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_PROJETS_STRUCTURANTS}
                />
              </section>
            </Bloc>
          </div>
        </div>
        <div className='fr-grid-row fr-mt-7v'>
          <div className='fr-col'>
            <Bloc>
              <TitreInfobulleConteneur>
                <Titre
                  baliseHtml='h2'
                  className='fr-text--lg fr-mb-0 fr-py-1v'
                  estInline
                >
                  Liste des projets structurants (
                  {nombreProjetsStructurantsDansLeTableau}
                  )
                </Titre>
                <Infobulle idHtml='infobulle-projetsStructurants-liste'>
                  {INFOBULLE_CONTENUS.projetsStructurants.listeDesProjetsStructurants}
                </Infobulle>
              </TitreInfobulleConteneur>
              <TableauProjetsStructurants
                données={projetsDuTerritoireSélectionnéEtTerritoiresEnfants}
                setNombreProjetsStructurantsDansLeTableau={setNombreProjetsStructurantsDansLeTableau}
              />
            </Bloc>
          </div>
        </div>
      </div>
    </main>
  );
}
