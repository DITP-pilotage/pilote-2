import { useRouter } from "next/router";
import Alerte from "@/components/_commons/Alerte/Alerte";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

const AlerteMetadataChantier = ({ alerte }: { alerte?: AlerteProps | null }) => {
  const { query } = useRouter();

  if (alerte) {
    return (
      <div className="mb-4">
        <Alerte titre={alerte.titre} type={alerte.type} />
      </div>
    );
  }
  if (query._action === "modification-reussie") {
    return (
      <div className="mb-4">
        <Alerte
          message="Les modifications ont bien été prises en compte."
          titre="Chantier modifié avec succès !"
          type="succès"
        />
      </div>
    );
  }
  if (query._action === "creation-reussie") {
    return (
      <div className="mb-4">
        <Alerte
          message="Le chantier a bien été créé."
          titre="Chantier créé avec succès !"
          type="succès"
        />
      </div>
    );
  }
  return null;
};

export default AlerteMetadataChantier;
