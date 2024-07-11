
import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigne from '@/client/components/_commons/ResponsablesLigne/ResponsablesLigne';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { ajoutVirguleAprèsIndex } from '@/client/utils/strings';
import { CoordinateurTerritorialRapportDetailleContrat, DirecteurProjetRapportDetailleContrat, ResponsableLocalRapportDetailleContrat,
  ResponsableRapportDetailleContrat,
} from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface ResponsablesPageChantierProps {
  responsables: ResponsableRapportDetailleContrat
  responsablesLocal: ResponsableLocalRapportDetailleContrat[],
  coordinateurTerritorial: CoordinateurTerritorialRapportDetailleContrat[],
  afficheResponsablesLocaux: boolean,
  maille: Maille | null,
  libelléChantier: Chantier['nom']
}

const adjectifReferent: Record<Maille, string> = {
  'nationale': 'national',
  'départementale': 'départemental',
  'régionale': 'régional',
}; 

export default function ResponsablesPageChantier({ responsables, responsablesLocal, coordinateurTerritorial, afficheResponsablesLocaux, maille, libelléChantier }: ResponsablesPageChantierProps) {

  const ajouterVirguleAprèsIndexDirecteurProjet = (directeurProjet:DirecteurProjetRapportDetailleContrat, index: number) => 
    (`${ajoutVirguleAprèsIndex(index)}${directeurProjet.nom}`);

  const ajouterVirguleAprèsIndexDirecteurResponsableLocal = (responsableLocal: ResponsableLocalRapportDetailleContrat, index: number) =>
    (`${ajoutVirguleAprèsIndex(index)}${responsableLocal.nom}`);

  const ajouterVirguleAprèsIndexCoordinateurTerritorial = (coordinateurTerritoral: CoordinateurTerritorialRapportDetailleContrat, index: number) =>
    (`${ajoutVirguleAprèsIndex(index)}${coordinateurTerritoral.nom}`);

  const listeNomsDirecteursProjets =  responsables.directeursProjet.map(ajouterVirguleAprèsIndexDirecteurProjet).filter(Boolean);
  const listeNomsResponsablesLocal = responsablesLocal.map(ajouterVirguleAprèsIndexDirecteurResponsableLocal).filter(Boolean);
  const listeNomsCoordinateurTerritorial = coordinateurTerritorial.map(ajouterVirguleAprèsIndexCoordinateurTerritorial).filter(Boolean);

  const listeEmailsDirecteursProjets = responsables.directeursProjet.map(directeur => directeur.email).filter(Boolean);
  const listeEmailsResponsablesLocal = responsablesLocal.map(responsableLocal => responsableLocal.email).filter(Boolean);
  const listeEmailsCoordinateursTerritorial = coordinateurTerritorial.map(coordinateur => coordinateur.email).filter(Boolean);

  return (
    <Bloc titre='National'>
      <ResponsablesLigne  
        libellé='Directeur(s) / directrice(s) du projet'
        libelléChantier={libelléChantier}
        listeEmailsResponsables={listeEmailsDirecteursProjets}
        listeNomsResponsables={listeNomsDirecteursProjets}
      />
      {
          !!afficheResponsablesLocaux && 
          <>
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigne
              libellé='Responsable local'
              libelléChantier={libelléChantier}
              listeEmailsResponsables={listeEmailsResponsablesLocal}
              listeNomsResponsables={listeNomsResponsablesLocal}
            />
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigne          
              libellé={`Coordinateur PILOTE ${maille ? adjectifReferent[maille] : ''}`}
              libelléChantier={libelléChantier}
              listeEmailsResponsables={listeEmailsCoordinateursTerritorial}
              listeNomsResponsables={listeNomsCoordinateurTerritorial}
            />
          </>
        }
    </Bloc>
  );
}
