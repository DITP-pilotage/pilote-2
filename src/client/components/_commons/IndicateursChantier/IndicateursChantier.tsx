import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurBloc from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc';
import IndicateursChantierStyled from '@/components/_commons/IndicateursChantier/IndicateursChantier.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import Alerte from '@/components/_commons/Alerte/Alerte';
import api from '@/server/infrastructure/api/trpc/api';
import { ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import {
  DétailsIndicateurs,
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

interface IndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: Record<string, DétailsIndicateurTerritoire>
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[]
  chantierEstTerritorialisé: boolean,
  estInteractif?: boolean
  estAutoriseAProposerUneValeurActuelle?: boolean
  territoireCode: string
  territoiresCompares: string[]
  mailleSelectionnee: MailleInterne
  alerteMiseAJourIndicateur: boolean
  mailsDirecteursProjets: string[]
}

const IndicateursChantier: FunctionComponent<IndicateursProps> = ({
  indicateurs,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  listeRubriquesIndicateurs,
  chantierEstTerritorialisé,
  estInteractif = true,
  estAutoriseAProposerUneValeurActuelle = false,
  territoireCode,
  territoiresCompares,
  mailleSelectionnee,
  alerteMiseAJourIndicateur,
  mailsDirecteursProjets,
}) => {

  const { codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

  if (indicateurs.length === 0) {
    return null;
  }

  const { data: sousIndicateursDisponibles } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_SOUS_INDICATEURS' });
  const listeIndicateursParent = !!sousIndicateursDisponibles ? 
    indicateurs.filter(indicateur => !indicateur.parentId) :
    indicateurs;

  return (
    <IndicateursChantierStyled>
      {
        alerteMiseAJourIndicateur ? (
          <div className='fr-mb-2w'>
            <Alerte
              titre='Mise à jour des données requise'
              type='warning'
            />
          </div>
        ) : null
      }
      {
        listeRubriquesIndicateurs.map(rubriqueIndicateur => {
          const indicateursDeCetteRubrique = listeIndicateursParent.filter(ind => ind.type === rubriqueIndicateur.typeIndicateur);

          if (indicateursDeCetteRubrique.length > 0) {
            return (
              <section
                className='fr-mb-3w sous-rubrique-indicateur'
                id={rubriqueIndicateur.ancre}
                key={rubriqueIndicateur.ancre}
              >
                <Titre
                  baliseHtml='h3'
                  className='fr-text--lg fr-mb-1w fr-mx-2w fr-mx-md-0'
                >
                  {rubriqueIndicateur.nom}
                </Titre>
                {
                  indicateursDeCetteRubrique
                    .sort((a, b) => comparerIndicateur(a, b, détailsIndicateurs[a.id][codeInsee]?.pondération, détailsIndicateurs[b.id][codeInsee]?.pondération))
                    .map(indicateur => {
                      const listeSousIndicateurs = !!sousIndicateursDisponibles ? 
                        indicateurs.filter(ind => ind.parentId === indicateur.id) :
                        [];
                      return (
                        <IndicateurBloc
                          chantierEstTerritorialisé={chantierEstTerritorialisé}
                          detailsIndicateursTerritoire={detailsIndicateursTerritoire}
                          détailsIndicateurs={détailsIndicateurs}
                          estAutoriseAProposerUneValeurActuelle={estAutoriseAProposerUneValeurActuelle}
                          estInteractif={estInteractif}
                          indicateur={indicateur}
                          key={indicateur.id}
                          listeSousIndicateurs={listeSousIndicateurs}
                          mailleSelectionnee={mailleSelectionnee}
                          mailsDirecteursProjets={mailsDirecteursProjets}
                          territoireCode={territoireCode}
                          territoiresCompares={territoiresCompares}
                        />
                      );
                      
                    })
                }
              </section>
            );
          }
        })
      }
    </IndicateursChantierStyled>
  );
};

export default IndicateursChantier;
