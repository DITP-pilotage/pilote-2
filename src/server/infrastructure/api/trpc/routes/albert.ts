import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";

const albertProvider = createOpenAI({
  baseURL: "https://albert.api.etalab.gouv.fr/v1",
  apiKey: process.env.ALBERT_API_KEY!,
});

export const albertRouter = créerRouteurTRPC({
  chat: procédureProtégée
    .input(
      z.object({
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const response = await generateText({
        model: albertProvider.chat("openai/gpt-oss-120b"),
        system:
          "Tu es un assistant spécialisé dans le suivi des politiques prioritaires du gouvernement français. " +
          "Formate toujours tes réponses en Markdown. Utilise des tableaux, listes et titres quand c'est pertinent pour structurer l'information.",
        prompt: input.prompt,
        stopWhen: stepCountIs(5),
        tools: {
          getSyntheseChantier: tool({
            description:
              "Récupère la synthèse des résultats d'un chantier par son ID (L'ID est au format CH-XXX (si l'utilisateur met 75, CH-75, CH-075, tout cela correspond à CH-075) ou par son nom",
            inputSchema: z.object({
              chantierId: z
                .string()
                .optional()
                .describe("L'identifiant du chantier (ex: CH-001)"),
              chantierNom: z
                .string()
                .optional()
                .describe("Le nom du chantier à rechercher"),
            }),
            execute: async ({ chantierId, chantierNom }) => {
              let resolvedChantierId = chantierId;

              if (!resolvedChantierId && chantierNom) {
                const chantier = await prisma.chantier_identite.findFirst({
                  where: {
                    nom: {
                      contains: chantierNom,
                      mode: "insensitive",
                    },
                  },
                  select: { id: true, nom: true },
                });

                if (!chantier) {
                  return {
                    error: `Aucun chantier trouvé avec le nom "${chantierNom}"`,
                  };
                }

                resolvedChantierId = chantier.id;
              }

              if (!resolvedChantierId) {
                return {
                  error:
                    "Veuillez fournir un identifiant ou un nom de chantier",
                };
              }

              const syntheses = await prisma.synthese_des_resultats.findMany({
                where: {
                  chantier_id: resolvedChantierId,
                  maille: "NAT",
                },
                orderBy: {
                  date_commentaire: "desc",
                },
                take: 5,
              });

              return {
                chantierId: resolvedChantierId,
                syntheses: syntheses.map((synthese) => ({
                  meteo: synthese.meteo,
                  commentaire: synthese.commentaire,
                  dateCommentaire: synthese.date_commentaire,
                  dateMeteo: synthese.date_meteo,
                })),
              };
            },
          }),
        },
      });

      await prisma.llm_calls.create({
        data: {
          prompt: input.prompt,
          user_email: ctx.session.user.email,
          answer: response as any,
        },
      });

      return {
        text: response.text,
      };
    }),
});
