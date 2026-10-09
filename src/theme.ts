import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';

export const appTheme = defineTheme({
  name: 'dete-dark',
  extends: neutralTheme,
  color: {
    accent: '#F59E0B', // Default gold accent, overridden dynamically per tenant
    neutralStyle: 'cool',
    contrast: 'standard',
  },
});
