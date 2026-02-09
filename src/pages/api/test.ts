import { NextApiRequest, NextApiResponse } from "next";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const myProvider = createOpenAI({
  baseURL: "https://albert.api.etalab.gouv.fr/v1",
  apiKey: process.env.ALBERT_API_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { text } = await generateText({
    model: myProvider.chat("openai/gpt-oss-120b"), // nom du modèle à adapter
    prompt: "Explique la RGPD en 3 phrases simples",
  });

  return res.json({ message: text });
}
