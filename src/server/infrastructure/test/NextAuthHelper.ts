import { encode } from 'next-auth/jwt';
import configuration from '@/server/infrastructure/Configuration';

export const getNextAuthSessionTokenPourUtilisateurEmail = (utilisateurEmail: string): Promise<string> => {
  return encode({
    token: {
      user: { email: utilisateurEmail },
    },
    secret: configuration.nextAuthSecret,
  });
};
