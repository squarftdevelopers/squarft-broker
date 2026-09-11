const fs = require("node:fs");
const path = require("node:path");

const appJson = require("./app.json");
const projectRoot = path.dirname(require.resolve("./app.json"));

const readDotEnvValue = (key) => {
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) return undefined;

  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));

  if (!line) return undefined;

  return line.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
};

const nativeGoogleMapsKey =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  readDotEnvValue("GOOGLE_MAPS_API_KEY") ||
  readDotEnvValue("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY");

if (!nativeGoogleMapsKey) {
  console.warn(
    "Google Maps API key is missing; native Google Maps will not work in standalone builds."
  );
}

module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    // The JavaScript location picker uses this to decide whether Google
    // Places/Geocoding is available. The Android SDK receives the same key
    // below during the native build.
    googleMapsApiKey: nativeGoogleMapsKey || null,
  },
  ios: {
    ...appJson.expo.ios,
    config: {
      ...appJson.expo.ios?.config,
      ...(nativeGoogleMapsKey ? { googleMapsApiKey: nativeGoogleMapsKey } : {}),
    },
  },
  android: {
    ...appJson.expo.android,
    config: {
      ...appJson.expo.android?.config,
      ...(nativeGoogleMapsKey
        ? { googleMaps: { apiKey: nativeGoogleMapsKey } }
        : {}),
    },
  },
  updates: {
    ...appJson.expo.updates,
    url: "https://u.expo.dev/349e4cf6-ce87-4216-98a1-a9d26a278880",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
};
