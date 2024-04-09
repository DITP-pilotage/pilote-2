import { Profil } from './Profil.interface';

export class ProfilBuilder {

  private code: Profil['code'] = 'DITP_ADMIN';

  private nom: Profil['nom'] = 'ditp admin';

  private chantiers: Profil['chantiers'] = {
    lecture: {
      tous: true,
      tousTerritorialisés: true,
      tousTerritoires: true,
      brouillons: true,
    },
    saisieCommentaire: {
      tousTerritoires: true,
      saisiePossible: true,
    },
    saisieIndicateur: {
      tousTerritoires: true,
    },
  };

  private projetsStructurants: Profil['projetsStructurants'] = {
    lecture: {
      tousPérimètres: true,
      mêmePérimètresQueChantiers: true,
      tousTerritoires: true,
      mêmeTerritoiresQueChantiers: true,
    },
  };

  private utilisateurs: Profil['utilisateurs'] = {
    modificationPossible: true,
    tousTerritoires: true,
    tousChantiers: true,
  };

  withUtilisateurs(utilisateurs: Profil['utilisateurs']): ProfilBuilder {
    this.utilisateurs = utilisateurs;
    return this;
  }

  withCode(code: Profil['code']): ProfilBuilder {
    this.code = code;
    return this;
  }


  build(): Profil {
    return {
      code: this.code,
      nom: this.nom,
      chantiers: this.chantiers,
      projetsStructurants: this.projetsStructurants,
      utilisateurs: this.utilisateurs,
    };
  }
}
