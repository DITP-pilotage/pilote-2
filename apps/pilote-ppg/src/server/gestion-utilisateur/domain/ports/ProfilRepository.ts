import { Profil } from "@/shared/profil/Profil.interface";

export interface ProfilRepository {
  recupererTous(): Promise<Profil[]>;
}
