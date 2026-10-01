import { Session } from "next-auth";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { TerritoireNonAutoriséErreur } from "@/server/utils/errors";
import {
  buildRapportDetailleContext,
  RapportDetailleContext,
  RapportDetailleQuery,
} from "@/server/rapport-detaille/rapportDetailleContext";
import { loadChantiersByIds } from "@/server/rapport-detaille/loadVueDEnsemble";
import { loadChantierDetails } from "@/server/rapport-detaille/loadChantierDetails";
import { withoutMailles } from "@/server/rapport-detaille/withoutMailles";
import {
  ChantierDetail,
  ChantierRapportDetailleWithoutMailles,
} from "@/server/rapport-detaille/rapportDetaille.interface";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";

export type ChantierDetailsBatchDependencies = {
  loadChantiersByIds: (
    chantierIds: string[],
    context: RapportDetailleContext,
  ) => Promise<{
    chantiers: ChantierRapportDetailleContrat[];
    selectedTerritoire: Territoire;
  }>;
  loadChantierDetails: (
    chantiers: ChantierRapportDetailleContrat[],
    context: RapportDetailleContext,
    selectedTerritoire: Territoire,
  ) => Promise<ChantierDetail[]>;
};

const defaultDependencies = (): ChantierDetailsBatchDependencies => ({
  loadChantiersByIds: (chantierIds, context) =>
    loadChantiersByIds(chantierIds, context),
  loadChantierDetails: (chantiers, context, selectedTerritoire) =>
    loadChantierDetails(chantiers, context, selectedTerritoire),
});

export async function fetchChantierDetailsBatch(
  input: {
    territoireCode: string;
    query: RapportDetailleQuery;
    chantierIds: string[];
  },
  session: Session,
  dependencies: ChantierDetailsBatchDependencies = defaultDependencies(),
): Promise<{
  chantiers: ChantierRapportDetailleWithoutMailles[];
  details: ChantierDetail[];
}> {
  if (
    !new Habilitation(session.habilitations).peutAccéderAuTerritoire(
      input.territoireCode,
    )
  ) {
    throw new TerritoireNonAutoriséErreur();
  }
  const context = buildRapportDetailleContext(
    input.query,
    input.territoireCode,
    session,
  );
  const { chantiers, selectedTerritoire } =
    await dependencies.loadChantiersByIds(input.chantierIds, context);
  const details = await dependencies.loadChantierDetails(
    chantiers,
    context,
    selectedTerritoire,
  );
  return { chantiers: chantiers.map(withoutMailles), details };
}
