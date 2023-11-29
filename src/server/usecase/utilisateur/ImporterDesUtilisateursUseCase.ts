import { objectEntries } from '@/client/utils/objects/objects';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { UtilisateurÀCréerOuMettreÀJourSansHabilitation } from '@/server/domain/utilisateur/Utilisateur.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { HabilitationsÀCréerOuMettreÀJourCalculées } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class ImporterDesUtilisateursUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository,
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository,
    private readonly territoireRepository: TerritoireRepository,
  ) {}

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async run(utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées })[], auteurModification: string): Promise<void> {
    for (const utilisateur of utilisateurs) {
      const territoires = await this.territoireRepository.récupérerTous();

      // FIXME: 
      // ATTENTION CE USECASE N'IMPLEMENTE PAS TOUTES LES REGLES DE VERIFICATION DE LA COHERENCE ENTRE LES INFORMATIONS FOURNIES ET LES PROFILS
      // SE REFERER AU USECASE CREER OU METTRE A JOUR UN UTILISATEUR POUR L'ENSEMBLE DES REGLES
      // IL EXISTE UNIQUEMENT CAR LE FORMULAIRE N'EST PAS ENCORE UTILISE ET AFIN QUE L'ON PUISSE CONTINUER A IMPLEMENTER CERTAINS DROITS CUSTOM
      // A SUPPRIMER DES QUE POSSIBLE POUR EVITER DES ERREURS :)

      for (const habilitation of objectEntries(utilisateur.habilitations)) {
        // AJOUTER LE PERIMETRE OUTRE MER POUR LES PROFILS DROM
        if (utilisateur.profil === 'DROM' && !utilisateur.habilitations[habilitation[0]].périmètres.includes('PER-018')) {
          utilisateur.habilitations[habilitation[0]].périmètres = [...utilisateur.habilitations[habilitation[0]].périmètres, 'PER-018'];
        } 

        habilitation[1].territoires.forEach((territoireCode, index) => {
        // TRANSFORMER LE NAT EN NAT-FR
          if (territoireCode === 'NAT') {
            utilisateur.habilitations[habilitation[0]].territoires[index] = 'NAT-FR';
          }

          // TRANSFORMER LE TOUS EN UNE LISTE DE TOUS LES TERRITOIRES
          if (territoireCode === 'TOUS') {
            utilisateur.habilitations[habilitation[0]].territoires = territoires.map(territoire => territoire.code);
            return;
          } 

          // AJOUTER AUTOMATIQUEMENT LES DEPARTEMENTS ENFANTS
          if (/^REG-.*/.test(territoireCode)) {
            const territoiresEnfants = territoires.filter(territoire => territoire.codeParent === territoireCode);
            const territoireCodeEnfants = territoiresEnfants.map(territoire => territoire.code);
            utilisateur.habilitations[habilitation[0]].territoires = [...utilisateur.habilitations[habilitation[0]].territoires, ...territoireCodeEnfants];
          }
        });
      }
    
      await this.utilisateurRepository.créerOuMettreÀJour(utilisateur, auteurModification);
    }
    const utilisateursPourIAM = utilisateurs.map(utilisateur => ({ nom:  utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }));
    await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
  }
}
