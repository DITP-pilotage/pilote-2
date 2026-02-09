import { NextApiRequest, NextApiResponse } from "next";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";

const myProvider = createOpenAI({
  baseURL: "https://albert.api.etalab.gouv.fr/v1",
  apiKey: process.env.ALBERT_API_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const response = await generateText({
    model: myProvider.chat("openai/gpt-oss-120b"), // nom du modèle à adapter
    prompt:
      "Donne-moi des informations sur Dracolosse. Fais en quelques paragraphes",
    stopWhen: stepCountIs(5),
    tools: {
      getPokemon: tool({
        description: "Fetches information about a Pokemon from the PokeAPI",
        inputSchema: z.object({
          name: z.string().describe("The name of the Pokemon to fetch"),
        }),
        execute: async ({ name }) => {
          const response = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`,
          );

          if (!response.ok) {
            throw new Error(`Pokemon not found: ${name}`);
          }

          const data = await response.json();

          return {
            name: data.name,
            types: data.types.map((t: any) => t.type.name),
            abilities: data.abilities.map((a: any) => a.ability.name),
            stats: data.stats.map((s: any) => ({
              name: s.stat.name,
              value: s.base_stat,
            })),
            height: data.height,
            weight: data.weight,
          };
        },
      }),
    },
  });

  console.log("-------------------");
  console.log(response.text);
  console.log("-------------------");

  return res.json(response);
}
