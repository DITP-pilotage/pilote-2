import { FunctionComponent } from "react";
import { Button } from "@/components/shared/Button";
import Input from "@/components/_commons/Input/Input";
import { useTokenAPIForm } from "@/components/PageAdminGestionTokenAPI/TokenAPIForm/useTokenAPIForm";

const TokenAPIForm: FunctionComponent = () => {
  const { errors, register } = useTokenAPIForm();
  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col-4">
          <label className="fr-text--md bold fr-mb-1v relative" htmlFor="email">
            Émail
          </label>
          <Input
            erreur={errors.email}
            htmlName="email"
            register={register("email")}
          />
        </div>
        <div className="fr-col-4 flex align-end">
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
