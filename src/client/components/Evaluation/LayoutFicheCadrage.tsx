import {
  createContext,
  PropsWithChildren,
  ReactNode,
  useContext,
  useState,
} from "react";
import {
  CritereOuObjectif,
  FicheCadrage,
} from "@/components/Evaluation/FicheCadrage";

type SetCritereOuObjectif = (critereOuObjectif: CritereOuObjectif) => void;

const context = createContext<null | SetCritereOuObjectif>(null);

export const useSetCritereOuObjectif = () => {
  const setCritereOuObjectif = useContext(context);
  if (setCritereOuObjectif === null) {
    throw new Error(
      "UseSetCritereOuObjectif must be used within a LayoutFicheCadrage",
    );
  }
  return setCritereOuObjectif;
};

export const UseSetCritereOuObjectif = ({
  children,
}: {
  children: (setter: SetCritereOuObjectif) => ReactNode;
}) => <>{children(useSetCritereOuObjectif())}</>;

// eslint-disable-next-line react/no-multi-comp
export const LayoutFicheCadrage = ({ children }: PropsWithChildren) => {
  const [critereOuObjectif, setCritereOuObjectif] =
    useState<CritereOuObjectif | null>(null);

  return (
    <context.Provider value={setCritereOuObjectif}>
      <main
        className="grid grid grid-cols-[1fr_auto] min-[2000px]:grid-cols-[var(--col-width)_1fr_auto] !bg-white min-h-screen"
        style={{ "--col-width": "600px" } as React.CSSProperties}
      >
        <div className="max-[2000px]:hidden" />
        <div className="flex flex-col items-center">{children}</div>
        <FicheCadrage critereOuObjectif={critereOuObjectif} />
      </main>
    </context.Provider>
  );
};
