import { FormValues } from "@/components/PageInstruction/form";

// TODO: À implémenter dans l'étape 2
export const useEnregistrerBrouillonInstruction = () => {
  return (values: FormValues) => {
    console.log("Enregistrement brouillon instruction:", values);
    return Promise.resolve();
  };
};
