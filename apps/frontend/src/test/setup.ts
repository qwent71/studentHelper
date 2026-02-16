import React from "react";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

vi.mock("next/image", () => {
  return {
    default: (
      props: React.ImgHTMLAttributes<HTMLImageElement> & {
        loader?: unknown;
        unoptimized?: boolean;
      },
    ) => {
      const { loader: _loader, unoptimized: _unoptimized, ...imgProps } = props;
      void _loader;
      void _unoptimized;
      return React.createElement("img", imgProps);
    },
  };
});
