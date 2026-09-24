import { NextApiRequest } from "next";
import { Files, IncomingForm } from "formidable";
import mime from "mime";
import { join } from "node:path";
import { mkdir, stat } from "node:fs/promises";
import { isENOENTError } from "@/server/utils/errors";

/**
 * Aucune limite de taille n'existait tant que le parsing etait delegue a un
 * service tiers. Depuis qu'il se fait ici, un fichier non borne expose le
 * process. Un import de 50 000 lignes pese ~3 Mo en CSV : 25 Mo laisse une
 * marge confortable sans rien refuser de ce qui passait jusqu'ici.
 */
export const OPTIONS_FORMULAIRE = {
  multiples: false,
  maxFiles: 1,
  maxFileSize: 25 * 1024 * 1024,
  // formidable refuse les fichiers vides par défaut, en levant depuis parseForm
  // — donc avant toute validation, hors de tout try/catch : la route renvoyait
  // un 500 et l'utilisateur n'obtenait aucun message. On les laisse passer, le
  // moteur de validation sait dire « Le fichier est vide ».
  allowEmptyFiles: true,
  minFileSize: 0,
  filename: (_name: string, _ext: string, part: { mimetype?: string | null }) =>
    `${_name}.${mime.getExtension(part.mimetype || "") || "unknown"}`,
} as const;

export async function parseForm(request: NextApiRequest): Promise<Files> {
  return new Promise<Files>(async (resolve, reject) => {
    const uploadDir = join(process.env.ROOT_DIR || process.cwd(), "/uploads");

    try {
      await stat(uploadDir);
    } catch (error) {
      if (isENOENTError(error)) {
        await mkdir(uploadDir, { recursive: true });
      } else {
        reject(error);
        return;
      }
    }

    const form = new IncomingForm({ ...OPTIONS_FORMULAIRE, uploadDir });

    form.parse(request, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve(files);
    });
  });
}
