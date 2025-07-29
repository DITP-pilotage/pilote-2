import { ChantierSynthetise } from "@/server/gestion-utilisateur/domain/ChantierSynthetise";
import { InformationChantierUtilisateur } from "@/server/gestion-utilisateur/domain/InformationChantierUtilisateur";

export interface ChantierRepository {
  récupérerChantiersSynthétisés({
    listeChantierIdLecture,
  }: {
    listeChantierIdLecture: string[];
  }): Promise<ChantierSynthetise[]>;
  listerInformationsChantiersUtilisateurs(): Promise<
    InformationChantierUtilisateur[]
  >;
}
