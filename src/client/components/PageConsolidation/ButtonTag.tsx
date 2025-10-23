import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";

export const ButtonTag = ({
  isActive,
  className,
  ...props
}: ComponentProps<"button"> & { isActive: boolean }) => {
  return (
    <button
      {...props}
      className={clsxm(
        className,
        "!py-1 !px-3 rounded-full max-w-[30ch] truncate",
        {
          "!bg-primary !text-white": isActive,
          "!bg-dsfr-blue-france-925 text-primary": !isActive,
        },
      )}
      type="button"
    />
  );
};
