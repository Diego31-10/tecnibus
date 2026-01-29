import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShadow } from '@/lib/utils/shadows';

type HeaderProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'parent' | 'driver' | 'admin';
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
};

export default function Header({
  title,
  subtitle,
  icon: Icon,
  variant = 'parent',
  showBackButton = true,
  onBackPress,
  rightIcon: RightIcon,
  onRightIconPress,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // Colores según variante
  const variantStyles = {
    parent: {
      bg: 'bg-primary-700',
      iconBg: 'bg-primary-600',
      subtitleColor: 'text-primary-200',
    },
    driver: {
      bg: 'bg-accent-600',
      iconBg: 'bg-accent-700',
      subtitleColor: 'text-accent-100',
    },
    admin: {
      bg: 'bg-admin-700',
      iconBg: 'bg-admin-600',
      subtitleColor: 'text-admin-200',
    },
  };

  const styles = variantStyles[variant];

  return (
    <View className={`${styles.bg} pb-6 px-6 rounded-b-3xl`} style={[{ paddingTop }, shadow]}>
      {/* Barra de navegación */}
      <View className="flex-row items-center justify-between mb-4">
        {showBackButton ? (
          <TouchableOpacity 
            onPress={handleBackPress}
            className={`${styles.iconBg} p-2 rounded-xl`}
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
        
        {RightIcon && (
          <TouchableOpacity 
            onPress={onRightIconPress}
            className={`${styles.iconBg} p-2 rounded-xl`}
          >
            <RightIcon size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido principal */}
      <View className="flex-row items-center">
        {Icon && (
          <View className={`${styles.iconBg} p-3 rounded-full mr-4`}>
            <Icon size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">
            {title}
          </Text>
          {subtitle && (
            <Text className={`${styles.subtitleColor} text-sm mt-1`}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}