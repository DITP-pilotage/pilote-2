import { DropdownMenu } from "radix-ui";
import { ComponentProps } from "react";
import Link from "next/link";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";

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
          "max-sm:w-[100vw]",
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
        "block !-mx-2 !-my-1 !px-2 py-1 rounded hover:bg-gray-200 bg-transparent transition-color font-medium",
        props.className,
      )}
    />
  ),
  Link: (props: ComponentProps<typeof Link>) => (
    <Link
      {...props}
      className={clsxm(
        "block -mx-2 -my-1 !px-2 py-1 rounded hover:!bg-gray-200 !bg-transparent transition-color font-medium !bg-none",
        props.className,
      )}
    />
  ),
  Divider: () => <div className="h-px bg-gray-200 -mx-4" role="separator" />,
  Item: ({ className, ...props }: ComponentProps<typeof DropdownMenu.Item>) => (
    <DropdownMenu.Item
      {...props}
      className={clsxm(
        " -m-2 p-2 flex items-center gap-2",
        "!outline-none cursor-pointer",
        "hover:bg-gray-100 rounded transition-colors",
        "text-sm font-medium",
        "!bg-none",
        className,
      )}
    />
  ),
  Icone: ({ className, ...props }: ComponentProps<typeof Icone>) => (
    <Icone className={clsxm("text-current h-5 w-5", className)} {...props} />
  ),
});
