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
  listeDirecteursProjet: DirecteurProjetRapportDetailleContrat[],
  listeResponsablesLocal: ResponsableLocalRapportDetailleContrat[],
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
  listeDirecteursProjet,
  listeResponsablesLocal,
  listeCoordinateursTerritorials,
  afficheResponsablesLocaux,
  maille,
  libelléChantier,
}) => {
  const libelleNomsDirecteursProjets = listeDirecteursProjet.map(directeurProjet => directeurProjet.nom).filter(Boolean).join(', ');
  const libelleNomsResponsablesLocal = listeResponsablesLocal.map(responsableLocal => responsableLocal.nom).filter(Boolean).join(', ');
  const libelleNomsCoordinateurTerritorial = listeCoordinateursTerritorials.map(coordinateurTerritorial => coordinateurTerritorial.nom).filter(Boolean).join(', ');

  const listeEmailsDirecteursProjets = listeDirecteursProjet.map(directeur => directeur.email).filter(Boolean);
  const listeEmailsResponsablesLocal = listeResponsablesLocal.map(responsableLocal => responsableLocal.email).filter(Boolean);
  const listeEmailsCoordinateursTerritorial = listeCoordinateursTerritorials.map(coordinateurTerritorial => coordinateurTerritorial.email).filter(Boolean);

  return (
    <Bloc titre='National'>
      <ResponsablesLigneChantier
        libelleNomsResponsables={libelleNomsDirecteursProjets}
        libellé='Directeur(s) / directrice(s) du projet'
        libelléChantier={libelléChantier}
        listeEmailsResponsables={listeEmailsDirecteursProjets}
      />
      {
        afficheResponsablesLocaux ? (
          <>
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigneChantier
              libelleNomsResponsables={libelleNomsResponsablesLocal}
              libellé='Responsable local'
              libelléChantier={libelléChantier}
              listeEmailsResponsables={listeEmailsResponsablesLocal}
            />
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigneChantier
              libelleNomsResponsables={libelleNomsCoordinateurTerritorial}
              libellé={`Coordinateur PILOTE ${maille ? adjectifReferent[maille] : ''}`}
              libelléChantier={libelléChantier}
              listeEmailsResponsables={listeEmailsCoordinateursTerritorial}
            />
          </>
        ) : null
      }
    </Bloc>
  );
};

export default ResponsablesPageChantier;
