import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { motion } from 'framer-motion';
import { 
  KeyIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline';

import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { login, addToWhitelist, removeFromWhitelist, getAuthToken, setAuthToken } from '@/lib/api';

const AdminPage: NextPage = () => {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [whitelistAddress, setWhitelistAddress] = useState('');

  // Check if the connected address is admin (for demo, using the deployer address)
  const isAdminAddress = address?.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

  const handleLogin = async () => {
    if (!address || !isAdminAddress) {
      setMessage('Please connect with an admin wallet');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Create a message to sign
      const messageToSign = `Login as admin: ${address}\nTimestamp: ${Date.now()}`;
      
      // Sign the message
      const signature = await signMessage({ message: messageToSign });
      
      // For demo purposes, we'll just use a simple JWT token
      // In production, the backend would verify the signature and issue a proper JWT
      const demoToken = `demo-admin-token-${address}-${Date.now()}`;
      setAuthToken(demoToken);
      setIsAuthenticated(true);
      setMessage('Successfully logged in as admin');
    } catch (error) {
      console.error('Login failed:', error);
      setMessage('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setIsAuthenticated(false);
    setMessage('Logged out successfully');
  };

  const handleAddToWhitelist = async () => {
    if (!whitelistAddress) {
      setMessage('Please enter an address');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      await addToWhitelist(whitelistAddress, token || '');
      setMessage(`Successfully added ${whitelistAddress} to whitelist`);
      setWhitelistAddress('');
    } catch (error) {
      console.error('Failed to add to whitelist:', error);
      setMessage('Failed to add to whitelist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWhitelist = async () => {
    if (!whitelistAddress) {
      setMessage('Please enter an address');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      await removeFromWhitelist(whitelistAddress, token || '');
      setMessage(`Successfully removed ${whitelistAddress} from whitelist`);
      setWhitelistAddress('');
    } catch (error) {
      console.error('Failed to remove from whitelist:', error);
      setMessage('Failed to remove from whitelist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Container className="py-24">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-4">Admin Panel</h1>
          <p className="text-gray-600">
            Please connect your wallet to access the admin panel.
          </p>
        </div>
      </Container>
    );
  }

  if (!isAdminAddress) {
    return (
      <Container className="py-24">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-4">Access Denied</h1>
          <p className="text-gray-600">
            You are not authorized to access the admin panel.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Current address: {address}
          </p>
          <p className="text-sm text-gray-500">
            Required admin address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
          </p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel - Whitelist Token</title>
        <meta name="description" content="Admin panel for whitelist token management" />
      </Head>

      <Container className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">
              Manage whitelist and token sale configuration.
            </p>
          </div>

          {/* Authentication Status */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <KeyIcon className="h-6 w-6 text-blue-500" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Authentication</h2>
                  <p className="text-sm text-gray-600">
                    Status: {isAuthenticated ? (
                      <span className="text-green-600 font-medium">Authenticated</span>
                    ) : (
                      <span className="text-red-600 font-medium">Not Authenticated</span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                {isAuthenticated ? (
                  <Button onClick={handleLogout} variant="outline">
                    Logout
                  </Button>
                ) : (
                  <Button onClick={handleLogin} disabled={isLoading}>
                    {isLoading ? 'Signing...' : 'Login with Wallet'}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Admin Functions */}
          {isAuthenticated && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Whitelist Management */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <UserPlusIcon className="h-6 w-6 text-green-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Whitelist Management</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ethereum Address
                    </label>
                    <input
                      type="text"
                      value={whitelistAddress}
                      onChange={(e) => setWhitelistAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleAddToWhitelist}
                      disabled={isLoading || !whitelistAddress}
                      className="flex-1"
                    >
                      Add to Whitelist
                    </Button>
                    <Button 
                      onClick={handleRemoveFromWhitelist}
                      disabled={isLoading || !whitelistAddress}
                      variant="outline"
                      className="flex-1"
                    >
                      Remove from Whitelist
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Sale Management */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ShieldCheckIcon className="h-6 w-6 text-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Sale Management</h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Sale management functions will be available here.
                  </p>
                  <div className="flex space-x-3">
                    <Button disabled className="flex-1">
                      Pause Sale
                    </Button>
                    <Button disabled variant="outline" className="flex-1">
                      Resume Sale
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Card className={`p-4 ${message.includes('Success') || message.includes('successfully') 
                ? 'bg-green-50 border-green-200' 
                : message.includes('failed') || message.includes('Failed') || message.includes('denied')
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm ${message.includes('Success') || message.includes('successfully') 
                  ? 'text-green-800' 
                  : message.includes('failed') || message.includes('Failed') || message.includes('denied')
                  ? 'text-red-800'
                  : 'text-blue-800'
                }`}>
                  {message}
                </p>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </Container>
    </>
  );
};

export default AdminPage;