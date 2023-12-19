import { Profil } from '@/server/domain/profil/Profil.interface';

export default interface MultiSelectProfilsProps {
  changementValeursSélectionnéesCallback: (profilsIdsSélectionnés: string[]) => void
  profils: Profil[]
  profilsIdsSélectionnésParDéfaut?: string[]
  valeursDésactivées?: string[]
  afficherBoutonsSélection?: boolean
}
