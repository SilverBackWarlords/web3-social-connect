/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL for Docker standalone deployment - KEEP THIS!
  output: 'standalone',

  // ADDED FIX: Webpack configuration to polyfill Buffer AND Process
  webpack: (config, { isServer, webpack }) => {
    // Fallback for resolving 'buffer' and 'process' modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser'), // <--- ADDED PROCESS HERE
    };

    // Make 'Buffer' and 'process' available as global variables everywhere
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser', // <--- ADDED PROCESS HERE
      })
    );

    return config;
  },
};

module.exports = nextConfig;
