import '../../index.css'
import { ClientOnly } from './client'

export function generateStaticParams() {
  return [
    { slug: [''] },
    { slug: ['product'] },
    { slug: ['dashboard'] },
    { slug: ['classify'] },
    { slug: ['classification-complete'] },
    { slug: ['settings'] },
    { slug: ['bulk-import'] },
    { slug: ['tariff-calculator'] },
    { slug: ['trade-flags'] },
    { slug: ['classification-history'] },
    { slug: ['navigation-demo'] },
    { slug: ['debug-stripe'] },
    { slug: ['oauth-callback'] },
    { slug: ['sso-callback'] },
  ]
}

export default function Page() {
  return <ClientOnly />
}
