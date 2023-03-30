import { z } from 'zod';

import {
  créerRouteurTRPC,
  procédurePublique,
  procédureProtégée,
} from '@/server/infrastructure/api/trpc/trpc';

export const indicateurRouter = créerRouteurTRPC({
  hello: procédurePublique
    .input(z.object({ text: z.string() }))
    .query(({ input }) => ({ greeting: `Hello ${input.text}` })),
  récupérerLePremier: procédureProtégée.query(({ ctx }) => {
    return ctx.prisma.indicateur.findFirst();
  }),
});
