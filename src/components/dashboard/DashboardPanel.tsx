import React from 'react';
import { View, type ViewProps } from 'react-native';
import { nexsyPalette } from '@/theme/nexsyrus';

/** Opaque dashboard cards, including when the rest of the app uses dark mode. */
export function DashboardPanel({ children, style, material, ...props }: ViewProps & { material?: 'hero' }) {
  const hero = material === 'hero';
  return <View {...props} style={[{ borderWidth: 1, borderRadius: 14, overflow: 'hidden' }, style, {
    backgroundColor: hero ? nexsyPalette.accent : nexsyPalette.solid,
    borderColor: hero ? nexsyPalette.accent : nexsyPalette.edge,
  }]}>{children}</View>;
}
