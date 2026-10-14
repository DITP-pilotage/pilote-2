import { ReactNode } from "react";

export const WidgetCartographieTitle = ({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
}) => {
  return (
    <div className="text-center">
      <p className="mb-0 font-bold">{title}</p>
      {subtitle ? <p className="mb-0 font-normal">{subtitle}</p> : null}
    </div>
  );
};
