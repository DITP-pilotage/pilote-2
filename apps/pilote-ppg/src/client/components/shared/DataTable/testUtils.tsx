import {
  type RenderOptions,
  render as renderWithoutUrl,
  renderHook as renderHookWithoutUrl,
} from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactElement } from "react";

export const render = (ui: ReactElement, options?: RenderOptions) =>
  renderWithoutUrl(ui, { wrapper: NuqsTestingAdapter, ...options });

export const renderHook = <Result,>(hook: () => Result) =>
  renderHookWithoutUrl(hook, { wrapper: NuqsTestingAdapter });
