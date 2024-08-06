import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigneChantier from '@/components/_commons/ResponsablesLigneChantier/ResponsablesLigneChantier';
import { Maille } from '@/server/domain/maille/Maille.interface';
import {
  CoordinateurTerritorialRapportDetailleContrat,
  DirecteurProjetRapportDetailleContrat,
  ResponsableLocalRapportDetailleContrat,
} from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface ResponsablesChantierProps {
  listeDirecteursProjets: DirecteurProjetRapportDetailleContrat[],
  listeResponsablesLocaux: ResponsableLocalRapportDetailleContrat[],
  listeCoordinateursTerritorials: CoordinateurTerritorialRapportDetailleContrat[],
  afficheResponsablesLocaux: boolean,
  maille: Maille | null,
  libelléChantier: Chantier['nom']
}

const adjectifReferent: Record<Maille, string> = {
  'nationale': 'national',
  'départementale': 'départemental',
  'régionale': 'régional',
};

const ResponsablesPageChantier: FunctionComponent<ResponsablesChantierProps> = ({
  listeDirecteursProjets,
  listeResponsablesLocaux,
  listeCoordinateursTerritorials,
  afficheResponsablesLocaux,
  maille,
  libelléChantier,
}) => {
  const libelleNomsDirecteursProjets = listeDirecteursProjets.map(directeurProjet => directeurProjet.nom).filter(Boolean).join(', ');
  const libelleNomsResponsablesLocal = listeResponsablesLocaux.map(responsableLocal => responsableLocal.nom).filter(Boolean).join(', ');
  const libelleNomsCoordinateurTerritorial = listeCoordinateursTerritorials.map(coordinateurTerritorial => coordinateurTerritorial.nom).filter(Boolean).join(', ');

  const libelleEmailsDirecteursProjets = listeDirecteursProjets.map(directeur => directeur.email).filter(Boolean).join('; ');
  const libelleEmailsResponsablesLocal = listeResponsablesLocaux.map(responsableLocal => responsableLocal.email).filter(Boolean).join('; ');
  const libelleEmailsCoordinateursTerritorial = listeCoordinateursTerritorials.map(coordinateurTerritorial => coordinateurTerritorial.email).filter(Boolean).join('; ');

  return (
    <Bloc titre='National'>
      <ResponsablesLigneChantier
        libelleEmailsResponsables={libelleEmailsDirecteursProjets}
        libelleNomsResponsables={libelleNomsDirecteursProjets}
        libellé='Directeur(s) / directrice(s) du projet'
        libelléChantier={libelléChantier}
      />
      {
        afficheResponsablesLocaux ? (
          <>
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigneChantier
              libelleEmailsResponsables={libelleEmailsResponsablesLocal}
              libelleNomsResponsables={libelleNomsResponsablesLocal}
              libellé='Responsable local'
              libelléChantier={libelléChantier}
            />
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigneChantier
              libelleEmailsResponsables={libelleEmailsCoordinateursTerritorial}
              libelleNomsResponsables={libelleNomsCoordinateurTerritorial}
              libellé={`Coordinateur PILOTE ${maille ? adjectifReferent[maille] : ''}`}
              libelléChantier={libelléChantier}
            />
          </>
        ) : null
      }
    </Bloc>
  );
};

export default ResponsablesPageChantier;
