import { FunctionComponent } from "react";
import { Controller } from "react-hook-form";
import { CheckboxField } from "@/components/shared/Checkbox";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { TextField } from "@/components/shared/TextField";
import { Button } from "@/components/shared/Button";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Modale } from "@/components/shared/Modale";
import { useModaleInscriptionInfolettre } from "./useModaleInscriptionInfolettre";

export const ModaleInscriptionInfolettre: FunctionComponent<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const {
    register,
    control,
    handleFermetureModale,
    handleSubmitForm,
    estConsentantALinscription,
    succesEnvoieEmail,
  } = useModaleInscriptionInfolettre();

  return (
    <Modale
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleFermetureModale();
        }
        onOpenChange(isOpen);
      }}
      open={open}
      size="md"
      title="Ne manquez pas les actualités de PILOTE"
      titleHidden
    >
      {!succesEnvoieEmail ? (
        <div>
          <h1 className="text-h4 md:text-h4-md mb-2 text-dsfr-blue-france-sun-113 flex justify-center">
            Ne manquez pas les actualités de PILOTE
          </h1>
          <p className="fr-mt-3w">
            Inscrivez-vous à notre infolettre{" "}
            <strong>pour rester informé des évolutions de PILOTE.</strong>
          </p>
          <ul>
            <li>Les dernières nouveautés de l'outil</li>
            <li>Les prochaines dates de webinaire</li>
            <li>
              Des conseils pratiques pour optimiser le pilotage de vos projets
            </li>
          </ul>
          <p className="fr-text fr-text--bold fr-mt-2w">
            👉 Une fois par mois, pas plus.
          </p>
          <form className="fr-mt-3w" method="post" onSubmit={handleSubmitForm}>
            <div className="fr-mb-3w">
              <label className="fr-label fr-text--bold" htmlFor="email">
                EMAIL
                {}
                <span className="text-error">*</span>
              </label>
              <TextField
                className={FIELD_GROUP_SPACING}
                disabled
                id="email"
                type="email"
                {...register("emailUtilisateur")}
              />
            </div>
            <Controller
              control={control}
              name="consentement"
              render={({ field }) => (
                <CheckboxField
                  checked={field.value}
                  id="consentement"
                  label={
                    <>
                      Je consens à recevoir l'infolettre "Minute PILOTE"
                      contenant des actualités et informations liées à
                      l'évolution de l'outil. Je pourrai me désabonner à tout
                      moment via le lien présent dans chaque envoi.
                      <span className="text-error">*</span>
                    </>
                  }
                  name={field.name}
                  onBlur={field.onBlur}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              )}
            />
            <Button
              variant="primary"
              className="mt-6"
              disabled={!estConsentantALinscription}
              type="submit"
            >
              M'inscrire maintenant
            </Button>
          </form>
        </div>
      ) : (
        <Alerte type="succès" classesSupplementaires="fr-mt-2w">
          <h3>Inscription enregistrée.</h3>
          <span>
            <p>Merci pour votre inscription à l'infolettre Minute PILOTE.</p>
            <p>
              Pour finaliser votre abonnement, veuillez confirmer votre adresse
              de messagerie en cliquant sur le lien que nous venons de vous
              envoyer par email.
            </p>
            <br />
            <p>
              Pensez à vérifier votre dossier de courriers indésirables si vous
              ne trouvez pas l'email dans votre boîte de réception.
            </p>
          </span>
        </Alerte>
      )}
    </Modale>
  );
};
