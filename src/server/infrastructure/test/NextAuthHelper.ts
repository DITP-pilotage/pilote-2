import { encode } from 'next-auth/jwt';
import { configuration } from '@/config';

export const getNextAuthSessionTokenPourUtilisateurEmail = (utilisateurEmail: string): Promise<string> => {
  return encode({
    token: {
      user: { email: utilisateurEmail },
    },
    secret: configuration.nextAuth.secret,
  });
};
