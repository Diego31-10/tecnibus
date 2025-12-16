import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Card from './Card';

type AnimatedCardProps = {
  children: React.ReactNode;
  title?: string;
  icon?: any;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
  delay?: number;
};

export default function AnimatedCard({
  children,
  delay = 0,
  ...cardProps
}: AnimatedCardProps) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      translateY.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Card {...cardProps}>{children}</Card>
    </Animated.View>
  );
}