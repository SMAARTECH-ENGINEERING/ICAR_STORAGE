import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  fontFamily,
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: '700' },
  bodyLg: { fontSize: 16, fontWeight: '500' },
  body: { fontSize: 14, fontWeight: '500' },
  bodySm: { fontSize: 13, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '600' },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
};

export default typography;
