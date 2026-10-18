/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        lato: ["Lato-Regular"],
        "lato-regular": ["Lato-Regular"],
        "lato-medium": ["Lato-Regular"],
        "lato-italic": ["Lato-Regular"],
        "lato-light": ["Lato-Light"],
        "lato-bold": ["Lato-Bold"],
        "lato-black": ["Lato-Black"],
        roboto: ["Roboto_400Regular"],
        "roboto-light": ["Roboto_300Light"],
        "roboto-medium": ["Roboto_500Medium"],
        "roboto-bold": ["Roboto_700Bold"],
        // Manrope
        "manrope-extralight": ["Manrope-Regular"], // Using Regular as fallback if ExtraLight not loaded
        "manrope-light": ["Manrope-Regular"],
        "manrope-regular": ["Manrope-Regular"],
        "manrope-medium": ["Manrope-Medium"],
        "manrope-semibold": ["Manrope-SemiBold"],
        "manrope-bold": ["Manrope-Bold"],
        "manrope-extrabold": ["Manrope-ExtraBold"],
      },
    },
  },
  plugins: [],
}