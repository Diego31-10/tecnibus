import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
  } from 'react-native-reanimated';
  import * as Haptics from 'expo-haptics';
  import Button from './Button';
  
  type AnimatedButtonProps = {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    icon?: any;
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    fullWidth?: boolean;
    enableHaptics?: boolean;
  };
  
  export default function AnimatedButton({
    onPress,
    enableHaptics = true,
    ...buttonProps
  }: AnimatedButtonProps) {
    const scale = useSharedValue(1);
  
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
  
    const handlePress = () => {
      if (enableHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    };
  
    return (
      <Animated.View
        style={animatedStyle}
        onTouchStart={() => {
          scale.value = withTiming(0.97, {
            duration: 100,
            easing: Easing.out(Easing.cubic),
          });
        }}
        onTouchEnd={() => {
          scale.value = withTiming(1, {
            duration: 150,
            easing: Easing.out(Easing.cubic),
          });
        }}
      >
        <Button
          {...buttonProps}
          onPress={handlePress}
        />
      </Animated.View>
    );
  }
  