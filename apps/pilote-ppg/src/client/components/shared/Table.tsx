import {
  ComponentPropsWithoutRef,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { clsxm } from "@/utils/clsxm";

const useHorizontalOverflow = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setOverflowing(element.scrollWidth > element.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return [ref, overflowing] as const;
};

export const DSFR_TEXT_SPACING_RESET = "[--text-spacing:0] [--title-spacing:0]";

export const INTERACTIVE_IN_CELL =
  "[&_:is(a,button)]:min-h-6 [&_:is(a,button)]:min-w-6 [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-2 [&_:is(a,button):focus-visible]:outline-dsfr-focus";

export type TableRootProps = Omit<
  ComponentPropsWithoutRef<"table">,
  "children"
> & {
  caption: ReactNode;
  captionHidden?: boolean;
  bordered?: boolean;
  containerClassName?: string;
  children: ReactNode;
};

function Root({
  caption,
  captionHidden = false,
  bordered = true,
  containerClassName,
  className,
  children,
  ...props
}: TableRootProps) {
  const captionId = useId();
  const [containerRef, overflowing] = useHorizontalOverflow();
  return (
    <div
      className={clsxm(
        "relative w-full overflow-x-auto",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus",
        DSFR_TEXT_SPACING_RESET,
        containerClassName,
      )}
      ref={containerRef}
      {...(overflowing
        ? { role: "region", tabIndex: 0, "aria-labelledby": captionId }
        : {})}
    >
      <table
        className={clsxm(
          "w-full border-separate border-spacing-0",
          bordered && "border border-dsfr-grey-625",
          className,
        )}
        {...props}
      >
        <caption
          className={clsxm(
            captionHidden
              ? "sr-only"
              : "mb-4 text-left text-[1.375rem]/7 font-bold text-dsfr-grey-50",
          )}
          id={captionId}
        >
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

function Header({ className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      className={clsxm("bg-dsfr-grey-1000 text-dsfr-grey-50", className)}
      {...props}
    />
  );
}

function Body({
  zebra = true,
  className,
  ...props
}: ComponentPropsWithoutRef<"tbody"> & { zebra?: boolean }) {
  return (
    <tbody
      className={clsxm(
        "bg-white",
        zebra && "[&>tr:nth-child(even)]:bg-dsfr-grey-1000",
        className,
      )}
      {...props}
    />
  );
}

function Footer({ className, ...props }: ComponentPropsWithoutRef<"tfoot">) {
  return <tfoot className={clsxm(className)} {...props} />;
}

function Row({ className, ...props }: ComponentPropsWithoutRef<"tr">) {
  return <tr className={clsxm(className)} {...props} />;
}

const CELL = "p-3 md:p-4 text-left align-middle text-sm/6";

function ColumnHeaderCell({
  scope = "col",
  className,
  ...props
}: ComponentPropsWithoutRef<"th"> & { children: ReactNode }) {
  return (
    <th
      className={clsxm(
        CELL,
        "pb-3.5 md:pb-4.5 font-bold",
        "border-b border-dsfr-grey-200",
        INTERACTIVE_IN_CELL,
        className,
      )}
      scope={scope}
      {...props}
    />
  );
}

function RowHeaderCell({
  className,
  ...props
}: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={clsxm(CELL, "font-normal", INTERACTIVE_IN_CELL, className)}
      scope="row"
      {...props}
    />
  );
}

function Cell({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return (
    <td className={clsxm(CELL, INTERACTIVE_IN_CELL, className)} {...props} />
  );
}

export const Table = Object.assign(Root, {
  Root,
  Header,
  Body,
  Footer,
  Row,
  ColumnHeaderCell,
  RowHeaderCell,
  Cell,
});
