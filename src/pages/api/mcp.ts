import { NextApiRequest, NextApiResponse } from "next";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getContainer } from "@/server/dependances";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const server = new McpServer({
    name: "Pilote 2",
    version: "1.0.0",
  });

  server.tool("say_hello", "A tool that says hello", async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ message: "Hello Pilo" + "te" }, null, 2),
        },
      ],
    };
  });

  server.tool("list_chantier", "Lister les chantiers sur Pilote", async () => {
    const chantiers = await getContainer("gestionUtilisateur")
      .resolve("chantierRepository")
      .listerInformationsChantiersUtilisateurs();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ chantiers }, null, 2),
        },
      ],
    };
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
    enableJsonResponse: true,
  });

  res.on("close", () => transport.close());

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
