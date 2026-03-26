import { FunctionComponent, ReactNode } from "react";

interface EncartProps {
  children: ReactNode;
}

const Encart: FunctionComponent<EncartProps> = ({ children }) => {
  return (
    <div className="encart-container py-4 px-8 bg-dsfr-blue-france-925">
      {children}
    </div>
  );
};

export default Encart;
