import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Custom Document for Next.js to set up the HTML structure and default meta tags.
 * See: https://nextjs.org/docs/pages/api-reference/pages/_document
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Rock Collection</title>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

