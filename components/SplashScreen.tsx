import LottieView from "lottie-react-native";

import tecni from "@/assets/TecniBus.json";

export default function SplashScreen({
  onFinish = (isCancelled) => {},
}: {
  onFinish?: (isCancelled: boolean) => void;
}) {
  return (
    <LottieView
      source={tecni}
      onAnimationFinish={onFinish}
      autoPlay
      resizeMode="cover"
      loop={false}
      style={{
        flex: 1,
        width: "100%",
      }}
    />
  );
}
