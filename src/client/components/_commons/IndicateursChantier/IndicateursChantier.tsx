import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurBloc from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc';
import IndicateursChantierStyled from '@/components/_commons/IndicateursChantier/IndicateursChantier.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import Alerte from '@/components/_commons/Alerte/Alerte';
import api from '@/server/infrastructure/api/trpc/api';
import {
  DétailsIndicateurs,
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import Infobulle from '@/client/components/_commons/Infobulle/Infobulle';
import { CartographieIndicateurType } from './Bloc/Détails/IndicateurDétails';

interface IndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: Record<string, DétailsIndicateurTerritoire>
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
      <Titre
        baliseHtml='h3'
        className='fr-text--lg fr-mb-1w fr-mx-2w fr-mx-md-0'
      >
        Indicateurs pris en compte dans le taux d’avancement du territoire
      </Titre>
      <Titre
        baliseHtml='h3'
        className='fr-text--lg fr-mb-1w fr-mx-2w fr-mx-md-0'
      >
        Indicateurs non pris en compte dans le taux d’avancement du territoire
        <Infobulle
          className='fr-pt-0'
          idHtml='infobulle-section-indicateurs-non-pris-en-compte'
        >
          <p className='fr-text--sm'>
            Ces indicateurs ne sont pas pris en compte pour le territoire. Toutefois, il peut être pris en compte dans le calcul du taux d’avancement pour d’autres territoires ou d’autres mailles géographiques
          </p>       
        </Infobulle>
      </Titre>
      <Titre
        baliseHtml='h3'
        className='fr-text--lg fr-mb-1w fr-mx-2w fr-mx-md-0'
      >
        Autres indicateurs
        <Infobulle
          className='fr-pt-0'
          idHtml='infobulle-section-autres-indicateurs'
        >
          <p className='fr-text--sm'>
            Ces indicateurs ne sont jamais pris en compte pour calculer le taux d’avancement de la PPG. Ils sont présentés pour donner des informations complémentaires sur l’impact et le déploiement de la PPG
          </p>          
        </Infobulle>
      </Titre>
      {
        listeIndicateursParent
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
    </IndicateursChantierStyled>
  );
};

export default IndicateursChantier;
