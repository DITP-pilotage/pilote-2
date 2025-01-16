import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import {
  ChantiersNonAutorisésCreationModificationUtilisateurErreur,
  ChantiersNonAutorisésSuppressionUtilisateurErreur,
  ProfilNonAutorisésSuppressionUtilisateurErreur,
  TerritoiresNonAutorisésCreationModificationUtilisateurErreur,
  TerritoiresNonAutorisésSuppressionUtilisateurErreur,
} from '@/server/utils/errors';
import { toutesLesValeursDuTableauSontContenuesDansLAutreTableau } from '@/client/utils/arrays';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { Habilitations } from './Habilitation.interface';

export default class Habilitation {
  constructor(private _habilitations: Habilitations) {}
  
  vérifierLesHabilitationsEnSuppressionUtilisateur(chantiersIds: Chantier['id'][], territoiresCodes: Territoire['code'][], profil: Profil | null) {
    if (!profil || !profil.utilisateurs.modificationPossible) {
      throw new ProfilNonAutorisésSuppressionUtilisateurErreur();
    }

    if (profil.utilisateurs.tousChantiers && !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(territoiresCodes, this._habilitations.gestionUtilisateur.territoires)) {
      throw new TerritoiresNonAutorisésSuppressionUtilisateurErreur();
    }

    if (profil.utilisateurs.tousTerritoires && !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(chantiersIds, this._habilitations.gestionUtilisateur.chantiers)) 
      throw new ChantiersNonAutorisésSuppressionUtilisateurErreur();
  }

  vérifierLesHabilitationsEnCréationModificationUtilisateur(chantiersIds: Chantier['id'][], territoiresCodes: Territoire['code'][], profil: Profil | null) {
    if (!profil || !profil.utilisateurs.modificationPossible) {
      throw new ProfilNonAutorisésSuppressionUtilisateurErreur();
    }
    if (profil.utilisateurs.tousChantiers && !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(territoiresCodes, this._habilitations.gestionUtilisateur.territoires)) {
      throw new TerritoiresNonAutorisésCreationModificationUtilisateurErreur();
    }
    if (profil.utilisateurs.tousTerritoires && !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(chantiersIds, this._habilitations.gestionUtilisateur.chantiers))
      throw new ChantiersNonAutorisésCreationModificationUtilisateurErreur();
  }
}
