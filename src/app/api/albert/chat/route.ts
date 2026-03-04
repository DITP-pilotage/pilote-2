import { validateUIMessages } from "ai";
import { z } from "zod";
import {
  Albert,
  displayChoicesTool,
  displayValeursIndicateurTool,
} from "@/server/albert/Albert";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import { getContainer } from "@/server/dependances";

const chatRequestSchema = z
  .object({
    id: z.string().min(1),
    messages: z.array(z.any()),
    agentContext: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = chatRequestSchema.parse(await request.json());
    const messages = await validateUIMessages({ messages: body.messages });

    const agentContext = body.agentContext ?? undefined;

    const territoiresAccessibles = session.habilitations.lecture.territoires;

    const container = getContainer("albert");
    const createGetSyntheseTerritoireTool = container.resolve(
      "createGetSyntheseTerritoireTool",
    );
    const createGetValeursIndicateurTool = container.resolve(
      "createGetValeursIndicateurTool",
    );

    const systemPrompt = buildChatSystemPrompt({
      territoiresAccessibles,
      agentContext,
    });
    const getSyntheseTerritoire = createGetSyntheseTerritoireTool({
      territoiresAccessibles,
    });
    const getValeursIndicateur = createGetValeursIndicateurTool({
      territoiresAccessibles,
    });

    const result = await Albert.streamText({
      chatId: body.id,
      messages,
      systemPrompt,
      userId: session.user.id,
      tools: {
        get_synthese_territoire: getSyntheseTerritoire,
        get_valeurs_indicateur: getValeursIndicateur,
        display_choices: displayChoicesTool,
        display_valeurs_indicateur: displayValeursIndicateurTool,
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in Albert chat stream:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
