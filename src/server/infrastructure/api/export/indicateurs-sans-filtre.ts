import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import ExportCsvDesIndicateursSansFiltreUseCase
  from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import configuration from '@/server/infrastructure/Configuration';

export default async function handleExportDesIndicateursSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');

  const stringifier = stringify({
    header: true,
    columns: ExportCsvDesIndicateursSansFiltreUseCase.NOMS_COLONNES,
    delimiter: ';',
    bom: true,
    quoted_string: true,
  });
  stringifier.pipe(response);

  const habilitation = new Habilitation(session.habilitations);
  const exportCsvDesIndicateursSansFiltreUseCase = new ExportCsvDesIndicateursSansFiltreUseCase(dependencies.getChantierRepository(), dependencies.getIndicateurRepository(), configuration);
  for await (const partialResult of exportCsvDesIndicateursSansFiltreUseCase.run(habilitation, session.profil)) {
    for (const indicateurPourExport of partialResult) {
      stringifier.write(indicateurPourExport);
    }
  }
  stringifier.end();
}
