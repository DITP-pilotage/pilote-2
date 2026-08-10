import Alerte from "@/components/_commons/Alerte/Alerte";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

const AlerteConditionnelle = ({
  show,
  ...props
}: { show: boolean } & AlerteProps) => {
  if (!show) return null;
  return (
    <div className="mb-4">
      <Alerte {...props} />
    </div>
  );
};

export default AlerteConditionnelle;
