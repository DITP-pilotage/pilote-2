import { DétailTerritoire } from "@/shared/territoire/Territoire.interface";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import {
  ChantierRapportDetailleWithoutMailles,
  ChantierDetail,
} from "@/server/rapport-detaille/rapportDetaille.interface";

export interface RapportDétailléChantierProps {
  territoireSélectionné: DétailTerritoire;
  mailleSelectionnee: MailleInterne;
  territoireCode: string;
  chantier: ChantierRapportDetailleWithoutMailles;
  detail: ChantierDetail;
  jalon: number;
}
