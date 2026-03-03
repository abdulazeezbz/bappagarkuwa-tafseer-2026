import { Platform } from 'react-native';

const tintColorLight = '#16944a';
const tintColorDark = '#53d68a';

export const Colors = {
  light: {
    text: '#102318',
    background: '#f2fbf5',
    surface: '#ffffff',
    tint: tintColorLight,
    icon: '#5f7567',
    tabIconDefault: '#5f7567',
    tabIconSelected: tintColorLight,
    border: '#c9e4d3',
    link: '#0f7f3d',
  },
  dark: {
    text: '#e9f8ef',
    background: '#0c1d13',
    surface: '#13291c',
    tint: tintColorDark,
    icon: '#97b7a2',
    tabIconDefault: '#97b7a2',
    tabIconSelected: tintColorDark,
    border: '#234330',
    link: '#77e8a8',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});