import { NextApiRequest, NextApiResponse } from 'next';
import { handleExportMetadataIndicateurs } from '@/server/infrastructure/api/export/metadata-indicateurs';

export default async function handle(request: NextApiRequest, response: NextApiResponse) {
  await handleExportMetadataIndicateurs(request, response);
}
