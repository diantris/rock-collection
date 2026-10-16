import React from 'react';
import Head from 'next/head';
import App from '../App';

// Next.js page component for the home page
export default function HomePage() {
  return (
    <>
      <Head>
        <title>My Rock Collection</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <App />
    </>
  );
}
