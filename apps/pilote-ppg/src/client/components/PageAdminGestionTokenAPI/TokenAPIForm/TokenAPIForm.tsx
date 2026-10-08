import { FunctionComponent } from "react";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { TextField } from "@/components/shared/TextField";
import { Button } from "@/components/shared/Button";
import { useTokenAPIForm } from "@/components/PageAdminGestionTokenAPI/TokenAPIForm/useTokenAPIForm";

const TokenAPIForm: FunctionComponent = () => {
  const { errors, register } = useTokenAPIForm();
  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col-4">
          <label
            className="fr-text--md font-bold fr-mb-1v relative"
            htmlFor="email"
          >
            Émail
          </label>
          <TextField
            className={FIELD_GROUP_SPACING}
            errorMessage={errors.email?.message?.toString()}
            id="email"
            {...register("email")}
          />
        </div>
        <div className="fr-col-4 flex items-end">
          <Button
            variant="primary"
            className="ml-4"
            key="submit-token-api"
            type="submit"
          >
            Créer un token API
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TokenAPIForm;
