import { DefaultSession } from 'next-auth';
import Permissions from '@server/domain/identité/Permissions';

declare module 'next-auth' {
  interface Session {
    user: {
      address: string
    } & DefaultSession['user']
    accessToken: string
    error: any
    permissions: Permissions
  }
}
