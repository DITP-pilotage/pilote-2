import type { NextApiRequest, NextApiResponse } from "next";
import type { UIMessage } from "ai";
import { Albert } from "@/server/albert/Albert";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import { getContainer } from "@/server/dependances";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const session = await auth(req, res);

  if (!session) {
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    const { messages } = req.body as { messages: UIMessage[] };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).send("Invalid request: messages array required");
      return;
    }

    const territoiresAccessibles = session.habilitations.lecture.territoires;

    const container = getContainer("albert");
    const createGetSyntheseTerritoireTool = container.resolve(
      "createGetSyntheseTerritoireTool",
    );

    const systemPrompt = buildChatSystemPrompt({ territoiresAccessibles });
    const getSyntheseTerritoire = createGetSyntheseTerritoireTool({
      territoiresAccessibles,
    });

    const result = await Albert.streamText({
      messages,
      systemPrompt,
      userId: session.user.id,
      tools: {
        get_synthese_territoire: getSyntheseTerritoire,
      },
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in Albert chat stream:", error);
    res.status(500).send("Internal Server Error");
  }
}
