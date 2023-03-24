import { DefaultSession } from 'next-auth';
import Habilitation from '@server/domain/identité/Habilitation';

declare module 'next-auth' {
  interface Session {
    user: {
      address: string
    } & DefaultSession['user']
    accessToken: string
    error: any
    habilitation: Habilitation
  }
}