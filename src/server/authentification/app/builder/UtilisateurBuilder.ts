import { Utilisateur } from '@/server/authentification/domain/Utilisateur';
import { HabilitationAuthentitificationAPI } from '@/server/authentification/domain/HabilitationAuthentitificationAPI';
import {
  HabilitationAuthentitificationAPIBuilder,
} from '@/server/authentification/app/builder/HabilitationAuthentitificationAPIBuilder';
import { ProfilAPI } from '@/server/authentification/domain/ProfilAPI';


export class UtilisateurBuilder {
  private email: string = 'test@test.com';

  private profil: ProfilAPI = 'DITP_ADMIN';

  private habilitations: HabilitationAuthentitificationAPI = new HabilitationAuthentitificationAPIBuilder().build();

  withEmail(email: string) {
    this.email = email;
    return this;
  }

  withProfil(profil: ProfilAPI) {
    this.profil = profil;
    return this;
  }

  withHabilitations(habilitations: HabilitationAuthentitificationAPI): UtilisateurBuilder {
    this.habilitations = habilitations;
    return this;
  }

  build() {
    return Utilisateur.creerUtilisateur({
      email: this.email,
      profil: this.profil,
      habilitations: this.habilitations,
    });
  }
}
