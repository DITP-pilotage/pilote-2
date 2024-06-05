import { ProfilAPI } from '@/server/authentification/domain/ProfilAPI';

export interface ProfilRepository {
  estAutoriseAAccederAuxChantiersBrouillons: ({ profilCode }: { profilCode: ProfilAPI }) => Promise<boolean>
}
