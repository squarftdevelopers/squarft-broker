
require("dotenv").config();

const appJson = require("./app.json");

module.exports = ({ config }) => {
  const baseConfig = appJson.expo;

  const androidGoogleMapsApiKey =
    process.env.GOOGLE_MAPS_ANDROID_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  const iosGoogleMapsApiKey =
    process.env.GOOGLE_MAPS_IOS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  // Keep this only if your JavaScript location picker needs the key.
  const placesApiKey =
    process.env.GOOGLE_MAPS_PLACES_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  return {
    ...config,
    ...baseConfig,

    extra: {
      ...config.extra,
      ...baseConfig.extra,

      ...(placesApiKey
        ? { googleMapsApiKey: placesApiKey }
        : {}),
    },

    ios: {
      ...config.ios,
      ...baseConfig.ios,

      config: {
        ...config.ios?.config,
        ...baseConfig.ios?.config,

        ...(iosGoogleMapsApiKey
          ? { googleMapsApiKey: iosGoogleMapsApiKey }
          : {}),
      },
    },

    android: {
      ...config.android,
      ...baseConfig.android,

      config: {
        ...config.android?.config,
        ...baseConfig.android?.config,

        ...(androidGoogleMapsApiKey
          ? {
              googleMaps: {
                ...baseConfig.android?.config?.googleMaps,
                apiKey: androidGoogleMapsApiKey,
              },
            }
          : {}),
      },
    },
  };
};
