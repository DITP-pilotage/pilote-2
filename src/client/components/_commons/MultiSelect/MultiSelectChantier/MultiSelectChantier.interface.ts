import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

export default interface MultiSelectChantierProps {
  changementValeursSélectionnéesCallback: (chantiersIdsSélectionnés: string[]) => void
  chantiers: ChantierSynthétisé[]
  chantiersIdsSélectionnésParDéfaut?: string[]
  valeursDésactivées?: string[]
}
