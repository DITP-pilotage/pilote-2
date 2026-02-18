import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs, ToolSet } from "ai";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";

const albertProvider = createOpenAI({
  baseURL: "https://albert.api.etalab.gouv.fr/v1",
  apiKey: process.env.ALBERT_API_KEY!,
});

const getSyntheseChantier = ({ userId }: { userId: string }) => {
  const description =
    "Récupère la synthèse des résultats d'un chantier par son ID (L'ID est au format CH-XXX (si l'utilisateur met 75, CH-75, CH-075, tout cela correspond à CH-075) ou par son nom";
  console.log(userId);
  return tool({
    description,
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
          error: "Veuillez fournir un identifiant ou un nom de chantier",
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
  });
};

const albertPilote = async ({
  prompt,
  systemPrompt,
  tools,
  userId,
}: {
  prompt: string;
  systemPrompt: string;
  tools?: ToolSet;
  userId: string;
}) => {
  let model = "openai/gpt-oss-120b";
  const response = await generateText({
    model: albertProvider.chat(model),
    system: systemPrompt,
    prompt: prompt,
    stopWhen: stepCountIs(5),
    onFinish: async (event) => {
      await prisma.llm_calls.create({
        data: {
          model,
          transcript: event as unknown as Prisma.InputJsonValue,
          utilisateur_id: userId,
        },
      });
    },
    tools,
  });

  return {
    text: response.text,
  };
};

const systemPrompt = `
  Tu es un analyste expert en pilotage de chantiers multi-territoriaux et en analyse de risques opérationnels.

  Tu interviens sur des données hiérarchisées par territoire :
  - Niveau national (NAT-FR)
  - Niveau régional (REG-XX)
  - Niveau départemental (DEPT-XX)
  
  Ces niveaux sont imbriqués : un territoire de niveau supérieur est censé refléter la situation agrégée de ses sous-territoires.
  
  Ta mission est de produire une synthèse stratégique et transverse à partir de multiples synthèses de résultats de chantiers.
  
  Tu dois :
  - Analyser la cohérence interne entre la météo déclarée et le commentaire associé
  - Comparer les niveaux territoriaux entre eux (NAT / REG / DEPT)
  - Détecter les incohérences verticales (ex : NAT-FR en SOLEIL alors que plusieurs REG ou DEPT sont en NUAGE ou ORAGE)
  - Identifier les territoires en difficulté ou à risque
  - Faire ressortir les tendances et causes récurrentes dans les commentaires
  - Repérer les anomalies, signaux faibles et risques systémiques
  
  Règles d’analyse :
  - Un territoire de niveau supérieur ne doit pas masquer des risques critiques répétés sur des sous-territoires
  - Les incohérences entre niveaux doivent être explicitement signalées
  - Tu distingues clairement :
    - Les constats factuels
    - Les interprétations analytiques
    - Les alertes de gouvernance
  
  Contraintes :
  - Tu raisonnes uniquement à partir des données fournies
  - Tu ne supposes jamais d’informations absentes
  - Tu hiérarchises les risques par criticité (faible / modéré / élevé)
  - Ton ton est factuel, synthétique et orienté décision
  
  Tu produis une synthèse exploitable par une direction de programme ou un comité de pilotage.
`;

export const albertRouter = créerRouteurTRPC({
  chat: procédureProtégée
    .input(
      z.object({
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const listeSyntheseResultat =
        await prisma.synthese_des_resultats.findMany({
          where: {
            chantier_id: "CH-075",
            territoire_code: {
              in: ["NAT-FR", "REG-01", "REG-02", "REG-03"],
            },
          },
          orderBy: {
            date_commentaire: "desc",
          },
        });
      return albertPilote({
        prompt: input.prompt.replace(
          "{{LISTE_DES_SYNTHESES}}",
          JSON.stringify(listeSyntheseResultat),
        ),
        systemPrompt,
        // tools: {
        //   getSyntheseChantier: getSyntheseChantier({
        //     userId: ctx.session.user.id,
        //   }),
        // },
        userId: ctx.session.user.email,
      });
    }),
});
