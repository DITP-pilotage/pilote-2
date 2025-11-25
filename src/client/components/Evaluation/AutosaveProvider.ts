import { createContext, useContext } from "react";

type Autosave = () => void;
const context = createContext<null | Autosave>(null);

export const useHandleAutosave = () => {
  const handleAutosave = useContext(context);
  if (handleAutosave === null) {
    throw new Error(
      "useHandleAutosave must be used within an AutosaveProvider",
    );
  }
  return handleAutosave;
};

export const AutosaveProvider = context.Provider;
