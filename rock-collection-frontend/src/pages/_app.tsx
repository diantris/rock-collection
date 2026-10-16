import type { AppProps } from 'next/app';
import { AppCacheProvider } from '@mui/material-nextjs/v16-pagesRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '../theme';

/**
 * Wraps every page with the MUI theme and the Emotion cache that lets MUI styles render on the server.
 * See: https://mui.com/material-ui/integrations/nextjs/#pages-router
 */
export default function MyApp(props: AppProps) {
  const { Component, pageProps } = props;
  return (
    <AppCacheProvider {...props}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </AppCacheProvider>
  );
}
