import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon, 
  ShieldCheckIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  UserGroupIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useSaleInfo } from '@/hooks/useSaleInfo';
import { useWhitelistStatus } from '@/hooks/useWhitelistStatus';
import { formatEther, formatNumber } from '@/utils/format';

const Home: NextPage = () => {
  const { address, isConnected } = useAccount();
  const { data: saleInfo, isLoading: saleInfoLoading } = useSaleInfo();
  const { data: whitelistStatus } = useWhitelistStatus(address);

  const features = [
    {
      icon: ShieldCheckIcon,
      title: 'Whitelist Protected',
      description: 'Only whitelisted addresses can participate in the token sale, ensuring fair distribution.',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Fixed Price',
      description: 'Transparent pricing with no hidden fees or dynamic pricing mechanisms.',
    },
    {
      icon: ChartBarIcon,
      title: 'Real-time Analytics',
      description: 'Track your purchases and the overall sale progress in real-time.',
    },
    {
      icon: UserGroupIcon,
      title: 'Community Driven',
      description: 'Built for the community with governance features and fair allocation.',
    },
    {
      icon: LockClosedIcon,
      title: 'Secure & Audited',
      description: 'Smart contracts are thoroughly tested and audited for maximum security.',
    },
  ];

  const stats = [
    {
      label: 'Token Price',
      value: saleInfo ? `${formatEther(saleInfo.tokenPrice)} ETH` : '--',
    },
    {
      label: 'Total Supply',
      value: saleInfo ? formatNumber(formatEther(saleInfo.maxSupply)) : '--',
    },
    {
      label: 'Tokens Sold',
      value: saleInfo ? formatNumber(formatEther(saleInfo.totalSold)) : '--',
    },
    {
      label: 'Progress',
      value: saleInfo 
        ? `${((Number(formatEther(saleInfo.totalSold)) / Number(formatEther(saleInfo.maxSupply))) * 100).toFixed(1)}%`
        : '--',
    },
  ];

  return (
    <>
      <Head>
        <title>Whitelist Token - Decentralized Token Sale</title>
        <meta name="description" content="Join our exclusive token sale with whitelist protection and fair distribution." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Whitelist Token - Decentralized Token Sale" />
        <meta property="og:description" content="Join our exclusive token sale with whitelist protection and fair distribution." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whitelist-token.com" />
        <meta property="og:image" content="/images/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Whitelist Token - Decentralized Token Sale" />
        <meta name="twitter:description" content="Join our exclusive token sale with whitelist protection and fair distribution." />
        <meta name="twitter:image" content="/images/og-image.png" />
      </Head>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
          <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <Container className="relative">
            <div className="py-24 sm:py-32 lg:py-40">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Whitelist Token
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
                    Sale
                  </span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
                  Join our exclusive token sale with whitelist protection, transparent pricing, 
                  and fair distribution. Secure your allocation today.
                </p>
                
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  {isConnected ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="group">
                        Go to Dashboard
                        <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  ) : (
                    <ConnectButton />
                  )}
                  
                  <Link href="#features">
                    <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-primary-900">
                      Learn More
                    </Button>
                  </Link>
                </div>

                {isConnected && whitelistStatus && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8"
                  >
                    <Card className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border-white/20">
                      <div className={`h-2 w-2 rounded-full ${whitelistStatus.isWhitelisted ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-white font-medium">
                        {whitelistStatus.isWhitelisted ? 'Whitelisted' : 'Not Whitelisted'}
                      </span>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </Container>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-8 md:grid-cols-4"
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {stat.label}
                    </dt>
                    <dd className="mt-2 text-3xl font-bold text-gray-900">
                      {saleInfoLoading ? (
                        <div className="h-9 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </dd>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </Container>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-gray-50">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why Choose Whitelist Token?
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Our token sale is designed with security, transparency, and fairness in mind.
              </p>
            </motion.div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                      <feature.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-gray-600">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary-900">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to Get Started?
              </h2>
              <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
                Connect your wallet and check your whitelist status to participate in the token sale.
              </p>
              <div className="mt-8">
                {isConnected ? (
                  <Link href="/dashboard">
                    <Button size="lg" variant="secondary" className="group">
                      Go to Dashboard
                      <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <ConnectButton />
                )}
              </div>
            </motion.div>
          </Container>
        </section>
      </main>
    </>
  );
};

export default Home;