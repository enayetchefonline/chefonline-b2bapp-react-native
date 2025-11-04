// constants/config.js
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const releaseChannel = Constants.expoConfig?.extra?.releaseChannel ?? 'development';

const ENV = {
  development: {
    API_BASE_URL: 'http://smartrestaurantsolutions.com/mobileapi-v2/v2/',
  },
  production: {
    API_BASE_URL: 'http://smartrestaurantsolutions.com/mobileapi-v2/v2/',
  },
};

const config = releaseChannel === 'production' ? ENV.production : ENV.development;

export default {
  APP_VERSION,
  API_BASE_URL: config.API_BASE_URL,
};
