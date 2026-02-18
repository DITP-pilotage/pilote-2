import { createOpenAI } from "@ai-sdk/openai";
import { generateText as aiGenerateText, stepCountIs, ToolSet } from "ai";
import { Prisma } from "@prisma/client";
import { configuration } from "@/config";
import { prisma } from "@/server/db/prisma";

export class Albert {
  static async generateText({
    prompt,
    systemPrompt,
    tools,
    userId,
  }: {
    prompt: string;
    systemPrompt: string;
    tools?: ToolSet;
    userId: string;
  }) {
    const albertProvider = createOpenAI({
      baseURL: "https://albert.api.etalab.gouv.fr/v1",
      apiKey: configuration().albert.apiKey,
    });

    const model = "openai/gpt-oss-120b";
    const response = await aiGenerateText({
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
  }
}
