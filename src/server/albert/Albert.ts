import { createOpenAI } from "@ai-sdk/openai";
import { generateText, stepCountIs, ToolSet } from "ai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

const albertProvider = createOpenAI({
  baseURL: "https://albert.api.etalab.gouv.fr/v1",
  apiKey: process.env.ALBERT_API_KEY!,
});

export const albertPilote = async ({
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
