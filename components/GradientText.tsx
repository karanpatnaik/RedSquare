import React from "react";
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { colors, typography } from "../styles/tokens";

interface Props {
  children: string;
  fontSize?: number;
  width?: number;
  height?: number;
  fontFamily?: string;
}

export default function GradientText({
  children,
  fontSize = typography.sizes.sm,
  width,
  height,
  fontFamily = typography.fonts.medium,
}: Props) {
  const w = width ?? children.length * (fontSize * 0.7);
  const h = height ?? fontSize * 1.5;
  const gradientId = React.useId();

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={colors.primary} />
          <Stop offset="55%" stopColor={colors.primaryDark} />
          <Stop offset="100%" stopColor={colors.primaryDarker} />
        </LinearGradient>
      </Defs>

      <SvgText
        fill={`url(#${gradientId})`}
        fontSize={fontSize}
        fontFamily={fontFamily}
        x={0}
        y={fontSize * 1.1}
      >
        {children}
      </SvgText>
    </Svg>
  );
}
