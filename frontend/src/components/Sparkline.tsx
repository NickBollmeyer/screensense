import React from 'react';
import Svg, { Polyline, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { View } from 'react-native';

type Props = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
};

export default function Sparkline({ values, width = 120, height = 40, color = '#00FF66' }: Props) {
  if (!values || values.length === 0) return <View style={{ width, height }} />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / Math.max(values.length - 1, 1);

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height * 0.85 - height * 0.075;
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.3} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Polygon points={fillPoints} fill="url(#sparkFill)" />
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
