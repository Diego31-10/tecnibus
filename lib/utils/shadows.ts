import { Platform, ViewStyle } from 'react-native';

type ShadowSize = 'sm' | 'md' | 'lg' | 'xl';

const shadowConfig = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
};

export const createShadow = (size: ShadowSize = 'md', color: string = '#000'): ViewStyle => {
  const config = shadowConfig[size];

  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: config.shadowOffset,
      shadowOpacity: config.shadowOpacity,
      shadowRadius: config.shadowRadius,
    };
  }

  return {
    elevation: config.elevation,
  };
};

export const useShadow = (size: ShadowSize = 'md', color?: string) => {
  return createShadow(size, color);
};
