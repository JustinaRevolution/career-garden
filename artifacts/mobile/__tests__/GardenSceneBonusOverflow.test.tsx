import React from "react";
import TestRenderer from "react-test-renderer";

import { GardenScene } from "@/components/GardenScene";

type Json = null | string | number | { children?: Json[] } | Json[];

function collectText(node: Json): string[] {
  if (node == null) return [];
  if (typeof node === "string") return [node];
  if (typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  return (node.children ?? []).flatMap(collectText);
}

function render(props: Partial<React.ComponentProps<typeof GardenScene>> = {}) {
  let tree!: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(
      <GardenScene gardenLevel={5} staticMode {...props} />
    );
  });
  return collectText(tree.toJSON() as Json);
}

describe("GardenScene bonus koi overflow indicator", () => {
  it("shows no +N indicator when bonus koi fit within the rendered spots", () => {
    const contents = render({ bonusKoi: 6 });
    expect(contents.some((c) => c.startsWith("+"))).toBe(false);
  });

  it("shows no +N indicator when there are no bonus koi", () => {
    const contents = render({ bonusKoi: 0 });
    expect(contents.some((c) => c.startsWith("+"))).toBe(false);
  });

  it("shows a +N indicator counting koi beyond the rendered cap", () => {
    const contents = render({ bonusKoi: 20 });
    // 20 earned - 6 rendered spots = 14 hidden
    expect(contents).toContain("+14");
  });

  it("renders the +N indicator in live (non-static) mode too", () => {
    const contents = render({ bonusKoi: 9, staticMode: false });
    expect(contents).toContain("+3");
  });
});
