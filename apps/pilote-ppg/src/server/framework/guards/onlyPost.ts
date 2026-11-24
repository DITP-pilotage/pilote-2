import type { NextApiHandler } from "next";

export function onlyPost(handler: NextApiHandler): NextApiHandler {
  return (request, response) => {
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Méthode non autorisée" });
    }

    return handler(request, response);
  };
}
