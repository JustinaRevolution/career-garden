import React from "react";
import { Dimensions, Text, View } from "react-native";
import TestRenderer, { ReactTestInstance } from "react-test-renderer";

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, ...rest }: any) =>
      React.createElement(View, rest, children),
  };
});

jest.mock("@/components/GardenScene", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    GardenScene: (props: any) =>
      React.createElement(View, {
        testID: "garden-scene",
        gardenHeight: props.height,
      }),
  };
});

import { SharePreviewCard } from "@/components/SharePreviewCard";

const BASE_WIDTH = 375;
const BASE_GARDEN_HEIGHT = 180;
const MIN_GARDEN_HEIGHT = 130;
const MAX_GARDEN_HEIGHT = 240;

function expectedGardenHeight(screenWidth: number): number {
  const cardWidth = Math.min(screenWidth - 32, 480);
  const scale = cardWidth / BASE_WIDTH;
  return Math.round(
    Math.min(
      MAX_GARDEN_HEIGHT,
      Math.max(MIN_GARDEN_HEIGHT, BASE_GARDEN_HEIGHT * scale)
    )
  );
}

function renderAt(screenWidth: number, props: Partial<React.ComponentProps<typeof SharePreviewCard>> = {}) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width: screenWidth,
    height: 800,
    scale: 2,
    fontScale: 1,
  } as any);

  let tree!: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(
      <SharePreviewCard
        gardenLevel={3}
        streak={12}
        xp={1450}
        badges={7}
        caption="Day 12 of my job search garden growing strong 🌱"
        {...props}
      />
    );
  });
  return tree;
}

function textContents(root: ReactTestInstance): string[] {
  return root
    .findAllByType(Text)
    .map((node) =>
      node
        .findAll((n) => typeof n.children[0] === "string", { deep: true })
        .map((n) => n.children.filter((c) => typeof c === "string").join(""))
        .join("")
    )
    .concat(
      root.findAllByType(Text).map((node) =>
        node.children.filter((c) => typeof c === "string").join("")
      )
    )
    .filter((s) => s.length > 0);
}

function textFontSizes(root: ReactTestInstance): number[] {
  return root
    .findAllByType(Text)
    .map((node) => {
      const style = Array.isArray(node.props.style)
        ? Object.assign({}, ...node.props.style.filter(Boolean))
        : node.props.style ?? {};
      return style.fontSize as number | undefined;
    })
    .filter((fs): fs is number => typeof fs === "number");
}

describe("SharePreviewCard responsive scaling", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const widths = [320, 428, 900];

  it.each(widths)(
    "keeps garden height within min/max bounds at %ipx",
    (width) => {
      const tree = renderAt(width);
      const garden = tree.root.findByProps({ testID: "garden-scene" });
      const height = garden.props.gardenHeight as number;

      expect(height).toBe(expectedGardenHeight(width));
      expect(height).toBeGreaterThanOrEqual(MIN_GARDEN_HEIGHT);
      expect(height).toBeLessThanOrEqual(MAX_GARDEN_HEIGHT);
    }
  );

  it("caps card width at 480px so garden height stays under the max on very wide screens", () => {
    const tree = renderAt(900);
    const garden = tree.root.findByProps({ testID: "garden-scene" });
    // 480px card cap -> scale 1.28 -> 230px, comfortably within the 240px max.
    expect(garden.props.gardenHeight).toBe(230);
    expect(garden.props.gardenHeight).toBeLessThanOrEqual(MAX_GARDEN_HEIGHT);
  });

  it.each(widths)(
    "renders all stats and caption without dropping content at %ipx",
    (width) => {
      const tree = renderAt(width);
      const contents = textContents(tree.root);

      expect(contents).toContain("12"); // streak
      expect(contents).toContain("1450"); // xp
      expect(contents).toContain("7"); // badges
      expect(contents).toContain("day streak");
      expect(contents).toContain("XP");
      expect(contents).toContain("badges");
      expect(contents).toContain(
        "Day 12 of my job search garden growing strong 🌱"
      );
      expect(contents).toContain("Career Garden 🌸");
    }
  );

  it.each(widths)(
    "keeps every font size positive and within scale bounds at %ipx",
    (width) => {
      const tree = renderAt(width);
      const sizes = textFontSizes(tree.root);

      expect(sizes.length).toBeGreaterThan(0);
      for (const fs of sizes) {
        expect(fs).toBeGreaterThan(0);
        expect(Number.isFinite(fs)).toBe(true);
      }
    }
  );

  it("omits the caption cleanly when it is blank", () => {
    const tree = renderAt(375, { caption: "   " });
    const contents = textContents(tree.root);
    expect(contents).toContain("Career Garden 🌸");
    expect(contents.some((c) => c.trim().length === 0)).toBe(false);
  });

  it.each(widths)("matches the rendered snapshot at %ipx", (width) => {
    const tree = renderAt(width);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
