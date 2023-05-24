import { objectEntries } from '@/client/utils/objects/objects';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { UtilisateurÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/Utilisateur.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class CréerOuMettreÀJourUnUtilisateurUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository = dependencies.getUtilisateurIAMRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
  ) {}

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async run(utilisateurs: UtilisateurÀCréerOuMettreÀJour[]): Promise<void> {
    for (const utilisateur of utilisateurs) {
      const territoires = await this.territoireRepository.récupérerTous();
      const profilsTerritoriaux = new Set(['REFERENT_REGION', 'PREFET_REGION', 'SERVICES_DECONCENTRES_REGION', 'REFERENT_DEPARTEMENT', 'PREFET_DEPARTEMENT', 'SERVICES_DECONCENTRES_DEPARTEMENT']);

      for (const habilitation of objectEntries(utilisateur.habilitations)) {
        // IGNORER LES DROITS D'ECRITURE POUR UNE LISTE DE PROFILS TERRITORIAUX (TEMPORAIRE)
        if ((habilitation[0] === 'saisie.commentaire' || habilitation[0] === 'saisie.indicateur') && profilsTerritoriaux.has(utilisateur.profil)) {
          utilisateur.habilitations[habilitation[0]].chantiers = [];
          utilisateur.habilitations[habilitation[0]].périmètres = [];
          utilisateur.habilitations[habilitation[0]].territoires = [];
        }

        // AJOUTER LE PERIMETRE OUTRE MER POUR LES PROFILS DROM
        if (utilisateur.profil === 'DROM' && !utilisateur.habilitations[habilitation[0]].périmètres.includes('PER-018')) {
          utilisateur.habilitations[habilitation[0]].périmètres = [...utilisateur.habilitations[habilitation[0]].périmètres, 'PER-018'];
        } 

        // TODO: VERIFIER LA COHERENCE DES TERRITOIRES ET CHANTIERS ENTRE LECTURE ET ECRITURE 

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
    
      await this.utilisateurRepository.créerOuMettreÀJour(utilisateur);
    }

    const utilisateursPourIAM = utilisateurs.map(utilisateur => ({ nom:  utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }));
    await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
  }
}
