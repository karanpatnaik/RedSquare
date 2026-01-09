import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../styles/tokens";

export default function AuthBackground() {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (scale: SharedValue<number>, opacity: SharedValue<number>, s1: number, s2: number, dur: number) => {
      scale.value = withRepeat(
        withSequence(
          withTiming(s1, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          withTiming(s2, { duration: dur, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: dur, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    };

    pulse(scale1, opacity1, 1.2, 1, 2000);
    pulse(scale2, opacity2, 1.3, 1, 2500);
    pulse(scale3, opacity3, 1.15, 1, 3000);
  }, [opacity1, opacity2, opacity3, scale1, scale2, scale3]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));
  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));
  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  return (
    <>
      <Animated.View style={[styles.circle1, animatedStyle1]} pointerEvents="none" />
      <Animated.View style={[styles.circle2, animatedStyle2]} pointerEvents="none" />
      <Animated.View style={[styles.circle3, animatedStyle3]} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  circle1: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.accentOne,
    top: -120,
    left: -80,
  },
  circle2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.accentTwo,
    top: -80,
    right: -60,
  },
  circle3: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accentThree,
    bottom: -110,
    left: -40,
  },
});
