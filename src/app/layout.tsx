import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import IntercomProvider from '@/components/IntercomProvider'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/Layout'
import '@/index.css'

export const metadata: Metadata = {
  title: 'Uni Customs',
  description: 'Uni automates customs brokerage',
  openGraph: {
    title: 'Uni Customs',
    description: 'Uni automates customs brokerage',
    url: 'https://www.uni-customs.com/',
    images: ['/og-image.png'],
  },
}

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('Missing Clerk publishable key')
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <head>
          {/* Google tag (gtag.js) */}
          <script async src="https://www.googletagmanager.com/gtag/js?id=AW-16933718921"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'AW-16933718921');
              `,
            }}
          />
          {/* Hotjar Tracking Code for https://www.uni-customs.com */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(h,o,t,j,a,r){
                    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                    h._hjSettings={hjid:5351526,hjsv:6};
                    a=o.getElementsByTagName('head')[0];
                    r=o.createElement('script');r.async=1;
                    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                    a.appendChild(r);
                })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
              `,
            }}
          />
        </head>
        <body>
          <div id="root">
            <IntercomProvider />
            <Layout>
              {children}
            </Layout>
            <Toaster />
          </div>
          {/* IMPORTANT: DO NOT REMOVE THIS SCRIPT TAG OR THIS VERY COMMENT! */}
          <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
        </body>
      </html>
    </ClerkProvider>
  )
}
