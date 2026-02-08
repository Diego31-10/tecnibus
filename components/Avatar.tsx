import { User } from 'lucide-react-native';
import { Image, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';

type AvatarProps = {
  avatarUrl?: string | null;
  size?: number;
  onPress?: () => void;
  backgroundColor?: string;
  iconColor?: string;
};

export default function Avatar({
  avatarUrl,
  size = 64,
  onPress,
  backgroundColor = '#e5e7eb',
  iconColor = '#9ca3af',
}: AvatarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
    overflow: 'hidden' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  const content = avatarUrl && !error ? (
    <>
      {loading && (
        <View style={{ ...containerStyle, position: 'absolute' }}>
          <ActivityIndicator size="small" color={iconColor} />
        </View>
      )}
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </>
  ) : (
    <User size={size * 0.5} color={iconColor} strokeWidth={2} />
  );

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}
