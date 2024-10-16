import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import { Options } from 'csv-stringify/lib/sync';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import ExportCsvDesIndicateursSansFiltreUseCase
  from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { configuration } from '@/config';
import { NON_APPLICABLE } from '@/server/infrastructure/export_csv/valeurs';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

export default async function handleExportDesIndicateurs(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');

  const stringifier = stringify({
    header: true,
    columns: session.profil === ProfilEnum.DITP_ADMIN ? [...ExportCsvDesIndicateursSansFiltreUseCase.NOMS_COLONNES, 'Chantier statut' || NON_APPLICABLE] : ExportCsvDesIndicateursSansFiltreUseCase.NOMS_COLONNES,
    delimiter: ';',
    bom: true,
    quoted_string: true,
  } satisfies Options);
  stringifier.pipe(response);

  const habilitation = new Habilitation(session.habilitations);
  const exportCsvDesIndicateursSansFiltreUseCase = new ExportCsvDesIndicateursSansFiltreUseCase(dependencies.getChantierRepository(), dependencies.getIndicateurRepository());
  for await (const partialResult of exportCsvDesIndicateursSansFiltreUseCase.run({
    habilitation,
    profil: session.profil,
    indicateurChunkSize: configuration.export.csvIndicateursChunkSize,
    optionsExport: {
      perimetreIds: request.query.perimetreIds ? Array.isArray(request.query.perimetreIds) ? request.query.perimetreIds : [request.query.perimetreIds] as string[] : [],
      estBarometre: request.query.estBarometre === 'true',
      estTerritorialise: request.query.estTerritorialise === 'true',
      listeStatuts: request.query.statut ? Array.isArray(request.query.statut) ? request.query.statut : [request.query.statut] as string[] : [],
      listeChantierId: request.query.listeChantierId ? (request.query.listeChantierId as string).split(',') : [],
    },

  })) {
    for (const indicateurPourExport of partialResult) {
      stringifier.write(indicateurPourExport);
    }
  }
  stringifier.end();
}
