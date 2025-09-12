import PublicationProps from "@/client/components/_commons/PublicationChantier/Publication.interface";

export default interface PublicationHistoriqueProps {
  type: PublicationProps["caractéristiques"]["type"];
  entité: PublicationProps["caractéristiques"]["entité"];
  réformeId: PublicationProps["réformeId"];
  maille: PublicationProps["maille"];
}
