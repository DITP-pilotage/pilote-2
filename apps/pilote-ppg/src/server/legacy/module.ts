import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import AxeRepository from "@/server/domain/axe/AxeRepository.interface";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import MinistèreRepository from "@/server/domain/ministère/MinistèreRepository.interface";
import IndicateurRepository from "@/server/domain/indicateur/IndicateurRepository.interface";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import TerritoireRepository from "@/server/domain/territoire/TerritoireRepository.interface";
import ChantierSQLRepository from "@/server/infrastructure/accès_données/chantier/ChantierSQLRepository";
import AxeSQLRepository from "@/server/infrastructure/accès_données/axe/AxeSQLRepository";
import MinistèreSQLRepository from "@/server/infrastructure/accès_données/ministère/MinistèreSQLRepository";
import IndicateurSQLRepository from "@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { TerritoireSQLRepository } from "@/server/infrastructure/accès_données/territoire/TerritoireSQLRepository";
import { RecupererRepartitionsMeteoChantiersUseCase } from "@/server/chantiers/usecases/RecupererRepartitionMeteoChantiersUseCase";
import { AgregerAvancementsChantiersUseCase } from "@/server/chantiers/usecases/AgregerAvancementsChantiersUseCase";
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase";
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase";
import type { GestionContenuExports } from "@/server/gestion-contenu/module";
import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";

export type LegacyExport = {
  agregerAvancementsChantiersUseCase: AgregerAvancementsChantiersUseCase;
};

type LegacyOwnCradle = LegacyExport & {
  chantierRepository: ChantierRepository;
  axeRepository: AxeRepository;
  synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
  ministèreRepository: MinistèreRepository;
  indicateurRepository: IndicateurRepository;
  commentaireRepository: CommentaireRepository;
  objectifRepository: ObjectifRepository;
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
  territoireRepository: TerritoireRepository;
  recupererRepartitionsMeteoChantiersUseCase: RecupererRepartitionsMeteoChantiersUseCase;
  récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase;
  récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase;
};

type LegacyCradle = LegacyOwnCradle & GestionContenuExports;

export const legacyModule = defineModule<LegacyExport, LegacyCradle>()({
  name: "legacy",
  imports: ["shared", "gestionContenu"],
  exports: ["agregerAvancementsChantiersUseCase"],
  register: (container, { asModuleClass }) => {
    container.register({
      chantierRepository: asModuleClass(ChantierSQLRepository).scoped(),
      axeRepository: asModuleClass(AxeSQLRepository).scoped(),
      synthèseDesRésultatsRepository: asModuleClass(
        SynthèseDesRésultatsSQLRepository,
      ).scoped(),
      ministèreRepository: asModuleClass(MinistèreSQLRepository).scoped(),
      indicateurRepository: asModuleClass(IndicateurSQLRepository).scoped(),
      commentaireRepository: asModuleClass(CommentaireSQLRepository).scoped(),
      objectifRepository: asModuleClass(ObjectifSQLRepository).scoped(),
      décisionStratégiqueRepository: asModuleClass(
        DécisionStratégiqueSQLRepository,
      ).scoped(),
      territoireRepository: asModuleClass(TerritoireSQLRepository).scoped(),
      recupererRepartitionsMeteoChantiersUseCase: asModuleClass(
        RecupererRepartitionsMeteoChantiersUseCase,
      ).scoped(),
      agregerAvancementsChantiersUseCase: asModuleClass(
        AgregerAvancementsChantiersUseCase,
      ).scoped(),
      récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase:
        asModuleClass(
          RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase,
        ).scoped(),
      récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase:
        asModuleClass(
          RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase,
        ).scoped(),
    } satisfies VerifyCradle<LegacyOwnCradle>);
  },
});

type Scope = ExtractScope<typeof legacyModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
