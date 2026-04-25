"use client";

import * as runtime from "react/jsx-runtime";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ComponentType } from "react";

type MDXModule = { default: ComponentType<{ components?: MDXComponents }> };
type MDXComponents = Record<string, ComponentType<unknown>>;

const sharedComponents: MDXComponents = {
  Image: Image as unknown as ComponentType<unknown>,
  Link: Link as unknown as ComponentType<unknown>,
  a: ((props: ComponentProps<"a">) => {
    const href = props.href ?? "";
    if (href.startsWith("/")) {
      return <Link href={href}>{props.children}</Link>;
    }
    return <a {...props} target="_blank" rel="noopener noreferrer" />;
  }) as unknown as ComponentType<unknown>,
};

function evalMdx(code: string): ComponentType<{ components?: MDXComponents }> {
  // Velite emits `arguments[0]` style modules; pass jsx-runtime in.
  const mod: MDXModule = new Function(code)(runtime);
  return mod.default;
}

export function Mdx({
  code,
  components,
}: {
  code: string;
  components?: MDXComponents;
}) {
  const Component = evalMdx(code);
  return (
    <Component components={{ ...sharedComponents, ...(components || {}) }} />
  );
}
