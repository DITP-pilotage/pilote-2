import { DefaultSession } from 'next-auth';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

declare module 'next-auth' {
  interface Session {
    user: {
      address: string
    } & DefaultSession['user']
    accessToken: string
    error: any
    habilitation: Utilisateur['scopes']
  }
}
