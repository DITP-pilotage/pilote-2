import Bloc from "@/components/_commons/Bloc/Bloc";
import { Badge } from "@/components/_commons/Badge";
import { DécisionStratégique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { libellésTypesDécisionStratégique } from "@/client/constants/libellésDécisionStratégique";

export const DecisionsStrategiquesRapportDetaille = ({
  décisionStratégique,
}: {
  décisionStratégique: DécisionStratégique;
}) => {
  return (
    <Bloc
      backgroundClassNameTitre="bg-dsfr-blue-france-925"
      titre="France"
      contenuClassesSupplémentaires="p-0"
    >
      <div className="py-4 px-6">
        <p className="font-bold mb-1 text-xl">
          {libellésTypesDécisionStratégique.suiviDesDecisionsStrategiques}
        </p>
        {décisionStratégique ? (
          <>
            <p className="text-xs text-dsfr-mention-grey mb-1">
              {`Mis à jour le ${PiloteDateFormatter.isoDateFranceMetropolitaine(décisionStratégique.date)} | Par ${décisionStratégique.auteur}`}
            </p>
            <div className="fr-text--sm fr-mb-0">
              <RenduContenuHtml html={décisionStratégique.contenu} />
            </div>
          </>
        ) : (
          <Badge type="gris">Non renseigné</Badge>
        )}
      </div>
    </Bloc>
  );
};
