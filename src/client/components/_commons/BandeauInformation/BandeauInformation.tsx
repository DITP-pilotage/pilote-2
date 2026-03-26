import { FunctionComponent, PropsWithChildren } from "react";
import { clsxm } from "@/utils/clsxm";

const warningStyle = {
  color: "var(--background-flat-warning)",
  backgroundColor: "var(--background-contrast-warning)",
  "--idle": "transparent",
  "--hover": "var(--background-contrast-info-hover)",
  "--active": "var(--background-contrast-info-active)",
} as const;

const getBandeauTypeConfig = (bandeauType: string) => {
  if (bandeauType === "INFO") {
    return { className: "fr-notice--info", style: undefined };
  }
  return {
    className: "fr-notice--info fr-notice--warning",
    style: warningStyle,
  };
};

const BandeauInformation: FunctionComponent<
  PropsWithChildren<{
    bandeauType: string;
    fermable?: boolean;
    classNameContainer?: string;
  }>
> = ({
  children,
  bandeauType,
  fermable = true,
  classNameContainer = "fr-container",
}) => {
  const { className, style } = getBandeauTypeConfig(bandeauType);
  return (
    <section>
      <div
        className={clsxm("fr-notice", className)}
        style={style as React.CSSProperties}
      >
        <div className={classNameContainer}>
          <div className="fr-notice__body flex">
            <p className="fr-notice__title">{children}</p>
            {fermable ? (
              <button
                className="fr-btn--close fr-btn"
                onClick={(event) => {
                  const notice =
                    event.currentTarget?.parentNode?.parentNode?.parentNode;
                  notice?.parentNode?.removeChild(notice);
                }}
                title="Masquer le message"
                type="button"
              >
                Masquer le message
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BandeauInformation;
