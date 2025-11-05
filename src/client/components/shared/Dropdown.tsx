import { DropdownMenu } from "radix-ui";
import { ComponentProps } from "react";
import Link from "next/link";
import { clsxm } from "@/utils/clsxm";

export const Dropdown = Object.assign({}, DropdownMenu, {
  Content: ({
    children,
    ...props
  }: ComponentProps<typeof DropdownMenu.Content>) => (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        {...props}
        className={clsxm(
          props.className,
          "bg-white rounded-md shadow-md border border-gray-100 px-4 py-3 z-10",
          "data-[state=open]:animate-dropdown-fade-in data-[state=closed]:animate-dropdown-fade-out",
        )}
        sideOffset={8}
      >
        <Dropdown.Arrow className="fill-gray-200" />
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  ),
  Button: (props: ComponentProps<"button">) => (
    <button
      type="button"
      {...props}
      className={clsxm(
        props.className,
        "block !-mx-2 !-my-1 !px-2 py-1 rounded hover:bg-gray-200 bg-transparent transition-color font-medium",
      )}
    />
  ),
  Link: (props: ComponentProps<typeof Link>) => (
    <Link
      {...props}
      className={clsxm(
        props.className,
        "block -mx-2 -my-1 !px-2 py-1 rounded hover:!bg-gray-200 !bg-transparent transition-color font-medium !bg-none",
      )}
    />
  ),
});
