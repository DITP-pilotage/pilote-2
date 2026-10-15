import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { FrameworkDependencies } from "@/server/framework/module";
import type { GestionContenuExports } from "@/server/gestion-contenu/module";
import { AlbertAccessRepository } from "./domain/ports/AlbertAccessRepository";
import { PrismaAlbertAccessRepository } from "./infrastructure/adapters/PrismaAlbertAccessRepository";
import { ListProfilsUseCase } from "./usecases/ListProfilsUseCase";
import { SetProfilActiveUseCase } from "./usecases/SetProfilActiveUseCase";
import { ListUtilisateursUseCase } from "./usecases/ListUtilisateursUseCase";
import { SearchUtilisateursUseCase } from "./usecases/SearchUtilisateursUseCase";
import { AddUtilisateurUseCase } from "./usecases/AddUtilisateurUseCase";
import { RemoveUtilisateurUseCase } from "./usecases/RemoveUtilisateurUseCase";
import { CheckAlbertAccessUseCase } from "./usecases/CheckAlbertAccessUseCase";
import { AssertAlbertAccessUseCase } from "./usecases/AssertAlbertAccessUseCase";

type AlbertAccessImports = FrameworkDependencies & GestionContenuExports;

type AlbertAccessOwnCradle = {
  albertAccessRepository: AlbertAccessRepository;
  listProfilsUseCase: ListProfilsUseCase;
  setProfilActiveUseCase: SetProfilActiveUseCase;
  listUtilisateursUseCase: ListUtilisateursUseCase;
  searchUtilisateursUseCase: SearchUtilisateursUseCase;
  addUtilisateurUseCase: AddUtilisateurUseCase;
  removeUtilisateurUseCase: RemoveUtilisateurUseCase;
  checkAlbertAccessUseCase: CheckAlbertAccessUseCase;
  assertAlbertAccessUseCase: AssertAlbertAccessUseCase;
};

type AlbertAccessCradle = AlbertAccessOwnCradle & AlbertAccessImports;

export const albertAccessModule = defineModule<NoExports, AlbertAccessCradle>()(
  {
    name: "albertAccess",
    imports: ["framework", "gestionContenu"],
    exports: [],
    register: (container, { asModuleClass }) => {
      container.register({
        albertAccessRepository: asModuleClass(PrismaAlbertAccessRepository),
        listProfilsUseCase: asModuleClass(ListProfilsUseCase),
        setProfilActiveUseCase: asModuleClass(SetProfilActiveUseCase),
        listUtilisateursUseCase: asModuleClass(ListUtilisateursUseCase),
        searchUtilisateursUseCase: asModuleClass(SearchUtilisateursUseCase),
        addUtilisateurUseCase: asModuleClass(AddUtilisateurUseCase),
        removeUtilisateurUseCase: asModuleClass(RemoveUtilisateurUseCase),
        checkAlbertAccessUseCase: asModuleClass(CheckAlbertAccessUseCase),
        assertAlbertAccessUseCase: asModuleClass(AssertAlbertAccessUseCase),
      } satisfies VerifyCradle<AlbertAccessOwnCradle>);
    },
  },
);

type Scope = ExtractScope<typeof albertAccessModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
