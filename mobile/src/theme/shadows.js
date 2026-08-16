import { Platform } from 'react-native';

function elevation(android, iosOpacity, iosRadius, iosOffset) {
  return Platform.select({
    android: { elevation: android },
    default: {
      shadowColor: '#0F172A',
      shadowOpacity: iosOpacity,
      shadowRadius: iosRadius,
      shadowOffset: { width: 0, height: iosOffset },
    },
  });
}

export const shadows = {
  none: {},
  xs: elevation(1, 0.04, 3, 1),
  sm: elevation(3, 0.06, 6, 2),
  md: elevation(6, 0.08, 12, 4),
  lg: elevation(10, 0.12, 20, 8),
  glow: {
    shadowColor: '#16A34A',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};

export default shadows;
