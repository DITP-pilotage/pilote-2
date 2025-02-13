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
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { CartographieIndicateurType } from './Bloc/Détails/IndicateurDétails';

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
  mailleQuery: MailleInterne
  mailleSelectionnee: MailleInterne
  alerteMiseAJourIndicateur: boolean
  mailsDirecteursProjets: string[]
  jalon: number
  cartographieDroiteIndicateur: CartographieIndicateurType
  cartographieGaucheIndicateur: CartographieIndicateurType
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
  mailleQuery,
  mailleSelectionnee,
  alerteMiseAJourIndicateur,
  mailsDirecteursProjets,
  jalon,
  cartographieDroiteIndicateur,
  cartographieGaucheIndicateur,
}) => {

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
                    .sort((a, b) => comparerIndicateur(a, b, détailsIndicateurs[a.id][territoireCode]?.pondération, détailsIndicateurs[b.id][territoireCode]?.pondération))
                    .map(indicateur => {
                      const listeSousIndicateurs = !!sousIndicateursDisponibles ?
                        indicateurs.filter(ind => ind.parentId === indicateur.id) :
                        [];
                      return (
                        <IndicateurBloc
                          cartographieDroiteIndicateur={cartographieDroiteIndicateur}
                          cartographieGaucheIndicateur={cartographieGaucheIndicateur}
                          chantierEstTerritorialisé={chantierEstTerritorialisé}
                          detailsIndicateursTerritoire={detailsIndicateursTerritoire}
                          détailsIndicateurs={détailsIndicateurs}
                          estAutoriseAProposerUneValeurActuelle={estAutoriseAProposerUneValeurActuelle}
                          estInteractif={estInteractif}
                          indicateur={indicateur}
                          jalon={jalon}
                          key={indicateur.id}
                          listeSousIndicateurs={listeSousIndicateurs}
                          mailleQuery={mailleQuery}
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
