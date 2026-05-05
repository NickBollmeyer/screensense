/**
 * ScreenSense Theme - Dark mode performance pro
 */
export const theme = {
  colors: {
    bg: '#0A0A0A',
    surface: '#121212',
    surfaceElevated: '#1A1A1A',
    surfaceHover: '#222222',
    primary: '#007AFF',
    primaryDim: 'rgba(0, 122, 255, 0.15)',
    accent: '#00FF66',
    accentDim: 'rgba(0, 255, 102, 0.15)',
    warning: '#FF3B30',
    warningDim: 'rgba(255, 59, 48, 0.15)',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.15)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  font: {
    // Use system fonts; on Android these read well at all sizes
    heading: 'System',
    body: 'System',
  },
};

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const formatDurationShort = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
};
