import { DefaultSession } from 'next-auth';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

declare module 'next-auth' {
  interface Session {
    user: {
      address: string
    } & DefaultSession['user']
    accessToken: string
    error: any
    habilitations: Habilitations
  }
}
