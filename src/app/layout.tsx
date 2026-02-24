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

const clerkConfigured = !!publishableKey
if (!clerkConfigured) {
  console.warn('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - auth features will not work')
}

function HtmlShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
          {children}
          <Toaster />
        </div>
        <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
      </body>
    </html>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const key = publishableKey || 'pk_test_Y2xlcmsuZHVtbXkuZGV2JA'

  return (
    <ClerkProvider publishableKey={key}>
      <HtmlShell>
        {clerkConfigured && <IntercomProvider />}
        <Layout>
          {children}
        </Layout>
      </HtmlShell>
    </ClerkProvider>
  )
}
