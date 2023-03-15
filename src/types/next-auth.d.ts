import { DefaultSession } from 'next-auth';
import Habilitations from '@server/domain/identité/Habilitations';

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
