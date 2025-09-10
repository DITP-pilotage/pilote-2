import { NextApiRequest, NextApiResponse } from "next";
import handleNextAuth from "@/server/infrastructure/api/auth/[...nextauth]";

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleNextAuth(req, res);
}
