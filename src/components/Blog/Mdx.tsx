import * as runtime from "react/jsx-runtime";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ComponentType, ReactNode } from "react";

type MDXModule = { default: (props: { components?: MDXComponents }) => ReactNode };
type MDXComponents = Record<string, ComponentType<unknown>>;

const sharedComponents: MDXComponents = {
  Image: Image as unknown as ComponentType<unknown>,
  Link: Link as unknown as ComponentType<unknown>,
  a: ((props: ComponentProps<"a">) => {
    const href = props.href ?? "";
    if (href.startsWith("/") && !href.startsWith("//")) {
      return <Link {...props} href={href} />;
    }
    if (/^(https?:)?\/\//i.test(href)) {
      return <a {...props} target="_blank" rel="noopener noreferrer" />;
    }
    return <a {...props} />;
  }) as unknown as ComponentType<unknown>,
};

function evalMdx(code: string): MDXModule["default"] {
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
  // Trusted, build-generated MDX is hook-free; render on the server, not via client eval.
  const render = evalMdx(code);
  return render({ components: { ...sharedComponents, ...components } });
}
