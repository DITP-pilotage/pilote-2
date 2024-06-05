import { HabilitationAuthentitificationAPI } from '@/server/authentification/domain/HabilitationAuthentitificationAPI';
import { ProfilAPI } from '@/server/authentification/domain/ProfilAPI';

export class Utilisateur {
  private readonly _email: string;

  private readonly _profil: ProfilAPI;

  private readonly _habilitations: HabilitationAuthentitificationAPI;

  private constructor({ email, profil, habilitations }: { email: string, profil: ProfilAPI, habilitations: HabilitationAuthentitificationAPI }) {
    this._email = email;
    this._profil = profil;
    this._habilitations = habilitations;
  }

  get email(): string {
    return this._email;
  }

  get profil(): ProfilAPI {
    return this._profil;
  }

  get habilitations(): HabilitationAuthentitificationAPI {
    return this._habilitations;
  }

  static creerUtilisateur({ email, habilitations, profil }: { email: string; habilitations: HabilitationAuthentitificationAPI, profil: ProfilAPI }) {
    return new Utilisateur({ email, habilitations, profil });
  }
}
