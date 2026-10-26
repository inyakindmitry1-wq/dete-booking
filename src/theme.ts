import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';

export const appTheme = defineTheme({
  name: 'dete-dark',
  extends: neutralTheme,
  color: {
    accent: '#FFFFFF', // Monochrome white accent
    neutralStyle: 'cool',
    contrast: 'standard',
  },
});
