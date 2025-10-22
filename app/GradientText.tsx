import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';


interface Props {
  children: string;
  fontSize?: number;
  width?: number;
  height?: number;
  fontFamily?: string;
} 


export default function GradientText({
  children,
  fontSize = 14,
  width,
  height,
  fontFamily = 'Jost_500Medium',
}: Props) {
  
  const w = width ?? children.length * (fontSize * 0.62);
  const h = height ?? fontSize * 1.15;

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#D74A4A" />
          <Stop offset="55%" stopColor="#9C2C2C" />
          <Stop offset="100%" stopColor="#932A2A" />
        </LinearGradient>
      </Defs>

      <SvgText
        fill="url(#grad)"
        fontSize={fontSize}
        fontFamily={fontFamily}
        x={0}
        y={fontSize}
      >
        {children}
      </SvgText>
    </Svg>
  );
}
