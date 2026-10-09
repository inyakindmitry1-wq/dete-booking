import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';

export const appTheme = defineTheme({
  name: 'dete-dark',
  extends: neutralTheme,
  colors: {
    modes: {
      dark: {
        page: '#0a0d14',
        surface: '#101520',
        primary: '#f59e0b', // Default gold accent, overridden by tenant accent_color
        text: '#f1f5f9',
        border: '#1e293b',
      },
    },
  },
  radius: {
    base: 12,
  },
});
