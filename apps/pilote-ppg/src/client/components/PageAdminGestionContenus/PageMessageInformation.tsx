import { FormProvider } from "react-hook-form";
import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { useMessageInformation } from "@/components/PageAdminGestionContenus/useMessageInformation";
import MessageInformationForm from "@/components/PageAdminGestionContenus/MessageInformationForm/MessageInformationForm";
import { MessageInformationContrat } from "@/server/app/contrats/MessageInformationContrat";
import Alerte from "@/components/_commons/Alerte/Alerte";

const PageMessageInformation: FunctionComponent<{
  messageInformation: MessageInformationContrat;
  modificationReussie: boolean;
}> = ({ messageInformation, modificationReussie }) => {
  const { reactHookForm, modifierIndicateur } = useMessageInformation({
    messageInformation,
    modificationReussie,
  });

  return (
    <div className="flex">
      <main>
        <div className="fr-mt-2w fr-mx-4w fr-mb-3w">
          <div className="fr-container">
            <h1 className="text-h1 md:text-h1-md mb-4">
              Message d'information
            </h1>
            <Bloc>
              {modificationReussie ? (
                <div className="fr-my-2w">
                  <Alerte titre="Modification réussie" type="succès" />
                </div>
              ) : null}
              <FormProvider {...reactHookForm}>
                <form
                  method="put"
                  onSubmit={reactHookForm.handleSubmit((data) => {
                    modifierIndicateur(data);
                  })}
                >
                  <MessageInformationForm />
                </form>
              </FormProvider>
            </Bloc>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageMessageInformation;
