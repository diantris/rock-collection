// theme.ts - MUI theme. Placeholder for now; the Material You (M3) restyle is planned for roadmap step 2.
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  shape: { borderRadius: 12 },
  typography: { button: { textTransform: 'none', fontWeight: 600 } },
});

export default theme;
