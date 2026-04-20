import { useEffect } from "react";

export const usePrintPageStyle = (css: string) => {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@media print { @page { ${css} } }`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [css]);
};
