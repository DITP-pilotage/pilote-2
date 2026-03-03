import type { UIMessage } from "ai";
import { Albert } from "@/server/albert/Albert";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import { getContainer } from "@/server/dependances";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { id, messages } = (await request.json()) as {
      id: string;
      messages: UIMessage[];
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array required", {
        status: 400,
      });
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
      chatId: id,
      messages,
      systemPrompt,
      userId: session.user.id,
      tools: {
        get_synthese_territoire: getSyntheseTerritoire,
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in Albert chat stream:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
