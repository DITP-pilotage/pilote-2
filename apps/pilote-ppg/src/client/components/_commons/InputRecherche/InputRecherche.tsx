import { FunctionComponent } from "react";
import { clsxm } from "@/utils/clsxm";
import { LoupePleineIcon } from "@/components/_commons/Icones/LoupePleineIcon";

interface InputRechercheProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const InputRecherche: FunctionComponent<InputRechercheProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => (
  <div className={clsxm("relative", className)}>
    <LoupePleineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none size-4" />
    <input
      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type="search"
      value={value}
    />
  </div>
);
