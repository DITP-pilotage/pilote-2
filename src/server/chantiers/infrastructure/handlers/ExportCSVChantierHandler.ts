import { NextApiRequest, NextApiResponse } from "next";
import { stringify } from "csv-stringify";
import { Options } from "csv-stringify/sync";
import assert from "node:assert/strict";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { configuration } from "@/config";
import { recupererJalon } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/recupererJalon";
import { OptionsExport } from "@/server/usecase/chantier/OptionsExport";
import { getContainer } from "@/server/dependances";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { ExportCsvDesChantiersUseCase } from "@/server/chantiers/usecases/ExportCsvDesChantiersUseCase";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";

export const handleExportDesChantiers = async (
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> => {
  const session = await auth(request, response);
  assert(session);

  response.setHeader("Content-Type", "text/csv");

  const jalonParDefaut = getAnneeDateDeBascule(
    new Date(),
    configuration().dateBasculeAffichageValeursAnneePrecedente,
  );
  const jalonSelectionne = recupererJalon(
    request.query?.jalon as string | undefined,
  );

  const optionsExport = {
    perimetreIds: request.query.perimetreIds
      ? Array.isArray(request.query.perimetreIds)
        ? request.query.perimetreIds
        : ([request.query.perimetreIds] as string[])
      : [],
    estBarometre: request.query.estBarometre === "true",
    territorialisation: request.query.territorialisation
      ? Array.isArray(request.query.territorialisation)
        ? request.query.territorialisation.map((maille) => maille as Maille)
        : [request.query.territorialisation as Maille]
      : [],
    listeStatuts: request.query.statut
      ? Array.isArray(request.query.statut)
        ? request.query.statut
        : ([request.query.statut] as string[])
      : session.profilAAccèsAuxChantiersBrouillons
        ? []
        : ["PUBLIE", "BROUILLON"],
    listeChantierId: [],
    listeMeteos: request.query.meteos
      ? Array.isArray(request.query.meteos)
        ? request.query.meteos
        : ([request.query.meteos] as string[])
      : [],
    listeOptionsExport: request.query.optionsExport
      ? Array.isArray(request.query.optionsExport)
        ? request.query.optionsExport
        : ([request.query.optionsExport] as string[])
      : [],
    territoireCode: request.query.territoireCode as string | undefined,
    estEnAlerteTauxAvancementNonCalculé:
      request.query.estEnAlerteTauxAvancementNonCalculé === "true",
    estEnAlerteÉcart: request.query.estEnAlerteÉcart === "true",
    estEnAlerteBaisse: request.query.estEnAlerteBaisse === "true",
    estEnAlerteMétéoNonRenseignée:
      request.query.estEnAlerteMétéoNonRenseignée === "true",
    estEnAlerteAbscenceTauxAvancementDepartemental:
      request.query.estEnAlerteAbscenceTauxAvancementDepartemental === "true",
    estEnAlertePossedePropositionsValeurAvancement:
      request.query.estEnAlertePossedePropositionsValeurAvancement === "true",
  } satisfies OptionsExport;

  const headersColumn = ExportCsvDesChantiersUseCase.NOMS_COLONNES(
    jalonSelectionne,
    optionsExport,
    session.profil,
  );

  const stringifier = stringify({
    header: true,
    columns: headersColumn,
    delimiter: ";",
    bom: true,
    quoted_string: true,
  } satisfies Options);

  stringifier.pipe(response);
  const habilitation = new Habilitation(session.habilitations);
  const territoireCodes =
    habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();
  const chunkSize = configuration().export.csvChantiersChunkSize;

  let territoireARecuperer = territoireCodes;

  if (
    optionsExport.territoireCode &&
    optionsExport.territoireCode !== "NAT-FR"
  ) {
    territoireARecuperer = await getContainer("chantiers")
      .resolve("territoireRepository")
      .recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({
        territoireCode: optionsExport.territoireCode,
      });
    territoireARecuperer = territoireARecuperer.filter((territoireCode) =>
      territoireCodes.includes(territoireCode),
    );
  }

  const chantierIds = await getContainer("chantiers")
    .resolve("chantierRepository")
    .récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
      habilitation.récupérerListeChantiersIdsAccessiblesEnLecture(),
      optionsExport,
    );

  const exportCsvDesChantiersUseCase = getContainer("chantiers").resolve(
    "exportCsvDesChantiersUseCase",
  );

  for await (const partialResult of exportCsvDesChantiersUseCase.run({
    chantierIds,
    territoireCodes: territoireARecuperer,
    profil: session.profil,
    chantierChunkSize: chunkSize,
    jalonSelectionne,
    jalonParDefaut,
    optionsExport,
  })) {
    for (const chantierPourExport of partialResult) {
      stringifier.write(chantierPourExport);
    }
  }

  stringifier.end();
};
