import { NextApiRequest } from 'next';
import { Files, IncomingForm } from 'formidable';
import mime from 'mime';
import { join } from 'node:path';
import { mkdir, stat } from 'node:fs/promises';

export async function parseForm(request: NextApiRequest): Promise<Files> {
  return new Promise<Files>(async (resolve, reject) => {
    const uploadDir = join(
      process.env.ROOT_DIR || process.cwd(),
      '/uploads',
    );

    try {
      await stat(uploadDir);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await mkdir(uploadDir, { recursive: true });
      } else {
        reject(error);
        return;
      }
    }
    const form = new IncomingForm({
      multiples: false,
      uploadDir,
      filename: (_name, _ext, part) => {
        return `${_name}.${
          mime.getExtension(part.mimetype || '') || 'unknown'
        }`;
      },
    });
    form.parse(request, (err, fields, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
}
