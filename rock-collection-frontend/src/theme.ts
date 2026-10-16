// theme.ts - Material You (Material Design 3) styling for MUI.
// Colours are generated from one seed colour with Google's material-color-utilities (tonal-spot scheme,
// like Android's dynamic colour); light and dark schemes follow the operating system setting.
import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';
import {
  argbFromHex, DynamicScheme, hexFromArgb, Hct, MaterialDynamicColors, SchemeTonalSpot,
} from '@material/material-color-utilities';

/** Change this one value to re-colour the whole app. */
export const SEED_COLOR = '#7b5ea7'; // muted amethyst

const roboto = Roboto({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '700'], display: 'swap' });

/** M3 colour roles that MUI's palette has no slot for; available as theme.vars.palette.m3.* */
export interface M3Tokens {
  surface: string;
  surfaceDim: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
}

declare module '@mui/material/styles' {
  interface Palette { m3: M3Tokens }
  interface PaletteOptions { m3?: M3Tokens }
}

/** Builds the MUI palette for one (light or dark) M3 scheme. */
function paletteFor(isDark: boolean) {
  const scheme: DynamicScheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(SEED_COLOR)), isDark, 0);
  const c = (role: keyof typeof MaterialDynamicColors) =>
    hexFromArgb((MaterialDynamicColors[role] as { getArgb(s: DynamicScheme): number }).getArgb(scheme));

  return {
    mode: isDark ? 'dark' as const : 'light' as const,
    primary: { main: c('primary'), contrastText: c('onPrimary') },
    secondary: { main: c('secondary'), contrastText: c('onSecondary') },
    error: { main: c('error'), contrastText: c('onError') },
    background: { default: c('surface'), paper: c('surface') },
    text: { primary: c('onSurface'), secondary: c('onSurfaceVariant') },
    divider: c('outlineVariant'),
    m3: {
      surface: c('surface'),
      surfaceDim: c('surfaceDim'),
      surfaceContainerLowest: c('surfaceContainerLowest'),
      surfaceContainerLow: c('surfaceContainerLow'),
      surfaceContainer: c('surfaceContainer'),
      surfaceContainerHigh: c('surfaceContainerHigh'),
      surfaceContainerHighest: c('surfaceContainerHighest'),
      onSurface: c('onSurface'),
      onSurfaceVariant: c('onSurfaceVariant'),
      outline: c('outline'),
      outlineVariant: c('outlineVariant'),
      inverseSurface: c('inverseSurface'),
      inverseOnSurface: c('inverseOnSurface'),
      primaryContainer: c('primaryContainer'),
      onPrimaryContainer: c('onPrimaryContainer'),
      secondaryContainer: c('secondaryContainer'),
      onSecondaryContainer: c('onSecondaryContainer'),
      tertiaryContainer: c('tertiaryContainer'),
      onTertiaryContainer: c('onTertiaryContainer'),
    },
  };
}

const theme = createTheme({
  // CSS variables + media-query colour schemes: dark mode follows the OS without a flash on load
  cssVariables: true,
  colorSchemes: { light: { palette: paletteFor(false) }, dark: { palette: paletteFor(true) } },
  shape: { borderRadius: 12 },
  // M3 type scale (https://m3.material.io/styles/typography/type-scale-tokens)
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: { fontSize: '3.5625rem', lineHeight: '4rem', fontWeight: 400 },        // display large
    h2: { fontSize: '2.8125rem', lineHeight: '3.25rem', fontWeight: 400 },     // display medium
    h3: { fontSize: '2.25rem', lineHeight: '2.75rem', fontWeight: 400 },       // display small
    h4: { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: 400 },           // headline large
    h5: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 400 },           // headline small
    h6: { fontSize: '1.375rem', lineHeight: '1.75rem', fontWeight: 400 },      // title large
    subtitle1: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 500, letterSpacing: '0.15px' },   // title medium
    subtitle2: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 500, letterSpacing: '0.1px' }, // title small
    body1: { fontSize: '1rem', lineHeight: '1.5rem', letterSpacing: '0.5px' },
    body2: { fontSize: '0.875rem', lineHeight: '1.25rem', letterSpacing: '0.25px' },
    button: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 500, letterSpacing: '0.1px', textTransform: 'none' },
    caption: { fontSize: '0.75rem', lineHeight: '1rem', letterSpacing: '0.4px' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 20, minHeight: 40, paddingInline: 24 },
        outlined: ({ theme }) => ({ borderColor: theme.vars.palette.m3.outline }),
        text: { paddingInline: 12 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 28, backgroundImage: 'none', backgroundColor: theme.vars.palette.m3.surfaceContainerHigh,
        }),
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.5rem', lineHeight: '2rem', padding: '24px 24px 16px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px 24px', gap: 8 } } },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: ({ theme }) => ({ borderColor: theme.vars.palette.m3.outlineVariant }),
      },
    },
    MuiMenu: {
      styleOverrides: { paper: ({ theme }) => ({ borderRadius: 4, backgroundColor: theme.vars.palette.m3.surfaceContainer }) },
    },
    MuiAutocomplete: {
      styleOverrides: { paper: ({ theme }) => ({ borderRadius: 4, backgroundColor: theme.vars.palette.m3.surfaceContainer }) },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 4 },
        notchedOutline: ({ theme }) => ({ borderColor: theme.vars.palette.m3.outline }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
        outlined: ({ theme }) => ({ borderColor: theme.vars.palette.m3.outline }),
        filled: ({ theme }) => ({
          backgroundColor: theme.vars.palette.m3.secondaryContainer, color: theme.vars.palette.m3.onSecondaryContainer,
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          borderRadius: 4, fontSize: '0.75rem',
          backgroundColor: theme.vars.palette.m3.inverseSurface, color: theme.vars.palette.m3.inverseOnSurface,
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.vars.palette.m3.outlineVariant }),
        head: ({ theme }) => ({ color: theme.vars.palette.m3.onSurfaceVariant, fontWeight: 500 }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.MuiTableRow-hover:hover': { backgroundColor: theme.vars.palette.m3.surfaceContainerHigh },
        }),
      },
    },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12, backgroundColor: theme.vars.palette.m3.surfaceContainerLow,
          '&::before': { display: 'none' },
          '&:not(:last-of-type)': { marginBottom: 8 },
        }),
      },
    },
  },
});

export default theme;
