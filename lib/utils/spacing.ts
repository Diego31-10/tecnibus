import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useHeaderSpacing = () => {
  const insets = useSafeAreaInsets();

  return {
    // Para headers principales (dashboards)
    paddingTop: Math.max(insets.top + 8, 48),

    // Para headers secundarios
    paddingTopSecondary: Math.max(insets.top, 12),
  };
};

export const useToastSpacing = () => {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + 16,
  };
};
