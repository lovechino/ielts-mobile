const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Override setHeader TRUOC khi middleware chay
      // Vi COOP duoc SET boi Expo internal middleware — removeHeader sau la vo hieu
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = (name, value) => {
        const blocked = ['cross-origin-opener-policy', 'cross-origin-embedder-policy'];
        if (blocked.includes(String(name).toLowerCase())) return res;
        return originalSetHeader(name, value);
      };
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
