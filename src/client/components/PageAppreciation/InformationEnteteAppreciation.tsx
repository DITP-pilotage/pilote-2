import { Lien } from "@/components/_commons/Lien/Lien";

export const InformationEnteteAppreciation = ({
  statutCompletionAppreciation = "PAS_DEBUTE",
}: {
  statutCompletionAppreciation:
    | "PAS_DEBUTE"
    | "AUTO_EVAL_EN_COURS"
    | "APPRECIATION_EN_COURS"
    | "TERMINE";
}) => {
  if (statutCompletionAppreciation === "PAS_DEBUTE") {
    return (
      <p>
        Lorsque la phase d'appréciation sera lancée, vous serez invités à porter
        une appréciation sur les auto-évaluations que vos territoires ont
        renseigné pour chacun des items requis – soit, pour un territoire : 4 à
        5 objectifs collectifs + 3 axes sur la manière de servir.
      </p>
    );
  }
  if (statutCompletionAppreciation === "AUTO_EVAL_EN_COURS") {
    return (
      <>
        <p>
          Lorsque la phase d'appréciation sera lancée, vous serez invités à
          porter une appréciation sur les auto-évaluations que vos territoires
          ont renseigné pour chacun des items requis – soit, pour un territoire
          : 4 à 5 objectifs collectifs + 3 axes sur la manière de servir.
        </p>
        <p>
          À toutes fins utiles, la section suivante vous propose une vue
          détaillée, formulaire par formulaire, des auto-évaluations en cours.
        </p>
      </>
    );
  }
  if (statutCompletionAppreciation === "APPRECIATION_EN_COURS") {
    return (
      <>
        <p className="!mb-0">
          Lorsque la phase d'appréciation sera lancée, vous serez invités à
          porter une appréciation sur les auto-évaluations que vos territoires
          ont renseigné pour chacun des items requis – soit, pour un territoire
          : 4 à 5 objectifs collectifs + 3 axes sur la manière de servir.
        </p>
        <p>
          Votre espace d'appréciation agrège ces items pour tous les territoires
          dans un tableau unique que vous pouvez trier et filtrer selon vos
          besoins.
        </p>
        <p className="!mb-0">Pour un item donné, merci de renseigner :</p>
        <ul>
          <li>la note que vous retenez,</li>
          <li>
            ainsi que votre commentaire (dans l'éventualité où votre note serait
            différente de la note proposée en auto-évaluation).
          </li>
        </ul>
        <p>
          Une fois que vous avez renseigné un item, n'hésitez pas à le "marquer
          comme traité" grâce à la case prévue à cet effet : cette
          fonctionnalité vous permettra de suivre l'avancement de votre travail
          tout au long du processus.
        </p>
        <div className="flex justify-center mb-4">
          <Lien
            href="appreciation/espace-appreciation"
            label="Accéder à mon espace d'appréciation"
            variant="button"
          />
        </div>
      </>
    );
  }

  if (statutCompletionAppreciation === "TERMINE") {
    return (
      <>
        <p className="!mb-0">
          La phase d'appréciation est close, toutes vos appréciations ont été
          transmises pour instruction.
        </p>
        <p>Nous vous remercions pour votre collaboration.</p>
        <div className="flex justify-center mb-4">
          <Lien
            href="appreciation/espace-appreciation"
            label="Consulter mon espace d'appréciation"
            variant="button-secondary"
          />
        </div>
      </>
    );
  }
};
