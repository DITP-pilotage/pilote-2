import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { ExportCsvDesChantiersSansFiltreUseCase } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { horodatage } from '@/server/infrastructure/export_csv/valeurs';


export default async function handleExportDesChantiersSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersSansFiltreUseCase();
  const chantiersPourExport = await exportCsvDesChantiersSansFiltreUseCase.run(session.habilitations);

  const csvFilename = `PILOTE-Chantiers-sans-filtre-${horodatage()}.csv`;

  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);

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
