import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useShadow } from '@/lib/utils/shadows';

type CardProps = {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
};

export default function Card({
  children,
  title,
  icon: Icon,
  iconColor = '#2563eb',
  iconBgColor = 'bg-primary-100',
  className = '',
}: CardProps) {
  const shadow = useShadow('md');

  return (
    <View className={`bg-white rounded-2xl p-5 ${className}`} style={shadow}>
      {/* Header del Card */}
      {(title || Icon) && (
        <View className="flex-row items-center justify-between mb-4">
          {title && (
            <Text className="text-lg font-bold text-gray-800 flex-1">
              {title}
            </Text>
          )}
          {Icon && (
            <View className={`${iconBgColor} p-2 rounded-full`}>
              <Icon size={20} color={iconColor} strokeWidth={2.5} />
            </View>
          )}
        </View>
      )}

      {/* Contenido del Card */}
      {children}
    </View>
  );
}