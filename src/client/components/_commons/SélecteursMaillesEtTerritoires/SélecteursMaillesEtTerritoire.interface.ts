import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface SélecteursMaillesEtTerritoiresProps {
  maillesDisponibles: MailleInterne[], 
  codesInseeDisponibles: CodeInsee[]
}
