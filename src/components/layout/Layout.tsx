import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Whitelist Token',
  description = 'Decentralized Token Sale with Whitelist Protection'
}) => {
  const { isConnected } = useAccount();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                  Whitelist Token
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-8">
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Home
                </Link>
                {isConnected && (
                  <>
                    <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Admin
                    </Link>
                  </>
                )}
              </nav>

              {/* Wallet Connection */}
              <div className="flex items-center">
                <ConnectButton 
                  chainStatus="icon"
                  accountStatus={{
                    smallScreen: 'avatar',
                    largeScreen: 'full',
                  }}
                  showBalance={true}
                />
              </div>
            </div>
          </div>
        </header>

        <main>
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout;