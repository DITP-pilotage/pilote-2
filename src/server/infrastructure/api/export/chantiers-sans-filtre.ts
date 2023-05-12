import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { ExportCsvDesChantiersSansFiltreUseCase } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';


export default async function handleExportDesChantiersSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersSansFiltreUseCase();
  const chantiersPourExport = await exportCsvDesChantiersSansFiltreUseCase.run(session.habilitations);

  response.setHeader('Content-Type', 'text/csv');

  const stringifier = stringify({
    header: true,
    columns: ExportCsvDesChantiersSansFiltreUseCase.NOMS_COLONNES,
    delimiter: ';',
    bom: true,
  });

  stringifier.pipe(response);
  for (const chantierPourExport of chantiersPourExport) {
    stringifier.write(chantierPourExport);
  }
  stringifier.end();
}
