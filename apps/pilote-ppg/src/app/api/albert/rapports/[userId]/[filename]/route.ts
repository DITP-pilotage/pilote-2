import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";

const SAFE_FILENAME_REGEX = /^[a-z0-9-]+-[a-f0-9]{8}\.(md|pdf)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; filename: string }> },
) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { userId, filename } = await params;

  if (userId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!SAFE_FILENAME_REGEX.test(filename)) {
    return new Response("Invalid filename", { status: 400 });
  }

  const container = getContainer("albert");
  const rapportFileStorage = container.resolve("rapportFileStorage");
  const result = await rapportFileStorage.read(userId, filename);

  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
