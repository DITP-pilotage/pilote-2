import { FunctionComponent } from 'react';
import HeaderFicheTerritoriale from '@/components/PageFicheTerritoriale/HeaderFicheTerritoriale';
import { TerritoireContrat } from '@/server/fiche-territoriale/app/contrats/TerritoireContrat';
import Encart from '@/components/_commons/Encart/Encart';
import Titre from '@/components/_commons/Titre/Titre';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';
import {
  AvancementsFicheTerritoriale,
} from '@/components/PageFicheTerritoriale/AvancementsFicheTerritoriale/AvancementsFicheTerritoriale';
import Bloc from '@/components/_commons/Bloc/Bloc';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import RépartitionMétéo from '@/components/_commons/RépartitionMétéo/RépartitionMétéo';
import { RepartitionMeteoContrat } from '@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat';
import '@gouvfr/dsfr/dist/utility/colors/colors.css';
import {
  ChantierFicheTerritorialeContrat,
} from '@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat';
import { TableauFicheTerritoriale } from '@/components/PageFicheTerritoriale/TableauFicheTerritoriale';
import PageFicheTerritorialeStyled from './PageFicheTerritoriale.styled';

export const PageFicheTerritoriale: FunctionComponent<{
  territoire: TerritoireContrat,
  avancementGlobalTerritoire: number,
  répartitionMétéos: RepartitionMeteoContrat,
  chantiersFicheTerritoriale: ChantierFicheTerritorialeContrat[]
}> = ({ territoire, avancementGlobalTerritoire, répartitionMétéos, chantiersFicheTerritoriale }) => {
  const now = new Date();

  return (
    <PageFicheTerritorialeStyled>
      <HeaderFicheTerritoriale />
      <main>
        <div className='fr-container fr-py-2w'>
          <Encart>
            <div className='flex justify-between'>
              <Titre
                baliseHtml='h2'
                className='fr-h2 fr-mb-0 fr-text-title--blue-france'
              >
                {`Fiche territoriale de synthèse ${territoire.nomAffiché}`}
              </Titre>
              <div className='flex justify-end'>
                <BoutonImpression />
              </div>
            </div>
          </Encart>
          <p className='fr-px-2w fr-m-0'>
            <i className='fr-text--sm fr-ital'>
              {`Fiche de synthèse généré le ${now.toLocaleString()}`}
            </i>
          </p>
          <Titre
            baliseHtml='h1'
            className='fr-h2 fr-mt-2w fr-px-2w'
          >
            Vue générale
          </Titre>
          <div className='fr-px-2w'>
            <Bloc>
              <div className='fr-grid-row'>
                <section className='fr-col-4 fr-px-2w'>
                  <TitreInfobulleConteneur>
                    <Titre
                      baliseHtml='h2'
                      className='fr-text--lg fr-mb-2w fr-py-1v'
                      estInline
                    >
                      Taux d’avancement moyen
                    </Titre>
                    <Infobulle idHtml='infobulle-chantiers-jauges'>
                      {INFOBULLE_CONTENUS.chantiers.jauges}
                    </Infobulle>
                  </TitreInfobulleConteneur>
                  <AvancementsFicheTerritoriale avancementGlobalTerritoire={avancementGlobalTerritoire} />
                </section>
                <hr className='fr-hr fr-my-3w fr-pb-1v' />
                <section className='fr-col-8'>
                  <TitreInfobulleConteneur>
                    <Titre
                      baliseHtml='h2'
                      className='fr-text--lg fr-mb-0 fr-py-1v'
                      estInline
                    >
                      Répartition des météos renseignées
                    </Titre>
                    <Infobulle idHtml='infobulle-chantiers-météos'>
                      {INFOBULLE_CONTENUS.chantiers.météos}
                    </Infobulle>
                  </TitreInfobulleConteneur>
                  <RépartitionMétéo météos={répartitionMétéos} />
                </section>
              </div>
            </Bloc>
          </div>
          <div className='fr-px-2w fr-mt-2w'>
            <Bloc>
              <Titre
                baliseHtml='h2'
                className='fr-text--lg fr-mb-2w fr-py-1v'
                estInline
              >
                {`Liste des chantiers (${59 + 1})`}
              </Titre>
              <TableauFicheTerritoriale chantiersFicheTerritoriale={chantiersFicheTerritoriale} />
            </Bloc>
          </div>
        </div>
      </main>
    </PageFicheTerritorialeStyled>
  )
  ;
};
