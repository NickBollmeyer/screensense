import React from 'react';
import { View } from 'react-native';
import {
  Briefcase,
  MessageCircle,
  Users,
  Film,
  Gamepad2,
  Sparkles,
  Globe,
  ShoppingBag,
  Newspaper,
  HeartPulse,
  Circle,
} from 'lucide-react-native';

const MAP: Record<string, any> = {
  briefcase: Briefcase,
  'message-circle': MessageCircle,
  users: Users,
  film: Film,
  'gamepad-2': Gamepad2,
  sparkles: Sparkles,
  globe: Globe,
  'shopping-bag': ShoppingBag,
  newspaper: Newspaper,
  'heart-pulse': HeartPulse,
};

type Props = {
  name: string;
  size?: number;
  color?: string;
  bg?: string;
  rounded?: number;
};

export default function CategoryIcon({
  name,
  size = 22,
  color = '#FFFFFF',
  bg,
  rounded = 12,
}: Props) {
  const Icon = MAP[name] || Circle;
  if (!bg) {
    return <Icon size={size} color={color} strokeWidth={1.8} />;
  }
  return (
    <View
      style={{
        width: size + 18,
        height: size + 18,
        borderRadius: rounded,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={size} color={color} strokeWidth={1.8} />
    </View>
  );
}
