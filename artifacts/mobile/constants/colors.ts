// "Luminous Day" palette from Stitch design
export const AppColors = {
  // Primary rose
  primary: '#C2515E',       // dark rose (buttons, active states)
  primaryLight: '#F5B4B6',  // soft rose (icon bg tints, highlights)
  primaryDark: '#8B3644',   // deep rose
  primaryBg: '#FFF0F1',     // very pale rose tint

  // Secondary
  secondaryBlue: '#1A73E8', // Google blue (e.g. Outlook badge)

  // Neutrals
  textDark: '#202124',
  textMed: '#5F6368',
  textLight: '#9AA0A6',

  // Task icon colors (soft pastels)
  taskColors: [
    '#F5B4B6', // rose
    '#A8D5E2', // sky blue
    '#A8D8A8', // mint green
    '#F9D5A7', // peach
    '#C4B5E8', // lavender
    '#F4B8D0', // pink
    '#B5D5C5', // sage
    '#F5C9A0', // apricot
    '#AECBFA', // periwinkle
    '#FDD8AA', // amber light
  ],

  light: {
    scaffoldBackground: '#F5F5F5',
    cardBackground: '#FFFFFF',
    headerBackground: '#1C1B1F',
    label: '#202124',
    secondaryLabel: '#5F6368',
    tertiaryLabel: '#9AA0A6',
    separator: '#E8EAED',
    separatorStrong: '#D2D4D8',
    primary: '#C2515E',
    primaryLight: '#F5B4B6',
    primaryBg: '#FFF0F1',
    currentTimeRed: '#C2515E',
    tabIconDefault: '#9AA0A6',
    tabIconSelected: '#C2515E',
    tint: '#C2515E',
    completionRing: '#E8EAED',
    proCardBg: '#6D2B37',
  },

  dark: {
    scaffoldBackground: '#121212',
    cardBackground: '#1E1E1E',
    headerBackground: '#1C1B1F',
    label: '#F1F3F4',
    secondaryLabel: '#BDC1C6',
    tertiaryLabel: '#9AA0A6',
    separator: '#3C4043',
    separatorStrong: '#5F6368',
    primary: '#F5B4B6',
    primaryLight: '#F5B4B6',
    primaryBg: '#3A1F22',
    currentTimeRed: '#F5B4B6',
    tabIconDefault: '#9AA0A6',
    tabIconSelected: '#F5B4B6',
    tint: '#F5B4B6',
    completionRing: '#3C4043',
    proCardBg: '#4A1E26',
  },
};

export default AppColors;
export const Colors = AppColors;
