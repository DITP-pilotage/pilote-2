import { DefaultSession } from 'next-auth';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { ProfilCode } from '@/server/domain/utilisateur/utilisateur.interface';

declare module 'next-auth' {
  interface Session {
    user: {
      address: string
    } & DefaultSession['user']
    accessToken: string
    error: any
    habilitations: Habilitations
    profil: ProfilCode
    profilAAccèsAuxChantiersBrouillons: boolean
  }
}
