import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import {
  ChantierRapportDetailleWithoutMailles,
  ChantierDetail,
} from "@/server/rapport-detaille/rapportDetaille.interface";

export default interface RapportDétailléChantierProps {
  territoireSélectionné: DétailTerritoire;
  mailleSelectionnee: MailleInterne;
  territoireCode: string;
  chantier: ChantierRapportDetailleWithoutMailles;
  detail: ChantierDetail;
  jalon: number;
}
