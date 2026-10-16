import { Html, Head, Main, NextScript, DocumentProps, DocumentContext } from 'next/document';
import { DocumentHeadTags, DocumentHeadTagsProps, documentGetInitialProps } from '@mui/material-nextjs/v16-pagesRouter';

/**
 * Custom Document: sets up the HTML structure, default meta tags and server-rendered MUI styles.
 * See: https://nextjs.org/docs/pages/api-reference/pages/_document
 */
export default function Document(props: DocumentProps & DocumentHeadTagsProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <DocumentHeadTags {...props} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext) => documentGetInitialProps(ctx);
