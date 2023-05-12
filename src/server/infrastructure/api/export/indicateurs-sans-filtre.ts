import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import ExportCsvDesIndicateursSansFiltreUseCase from '@/server/usecase/indicateur/ExportCsvDesIndicateursSansFiltreUseCase';
import { horodatage } from '@/server/infrastructure/export_csv/valeurs';

export default async function handleExportDesIndicateursSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  const exportCsvDesIndicateursSansFiltreUseCase = new ExportCsvDesIndicateursSansFiltreUseCase();
  const indicateursPourExport = await exportCsvDesIndicateursSansFiltreUseCase.run(session.habilitations);

  const csvFilename = `PILOTE-Indicateurs-sans-filtre-${horodatage()}.csv`;

  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);

  const stringifier = stringify({
    header: true,
    columns: ExportCsvDesIndicateursSansFiltreUseCase.NOMS_COLONNES,
    delimiter: ';',
    bom: true,
  });

  stringifier.pipe(response);
  for (const indicateurPourExport of indicateursPourExport) {
    stringifier.write(indicateurPourExport);
  }
  stringifier.end();
}
