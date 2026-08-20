import { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_COLOR = "#80D160";
const INACTIVE_COLOR = "#FFFFFF";
const MAX_BAR_WIDTH = 320;

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const barWidth = Math.min(screenWidth - 48, MAX_BAR_WIDTH);
  const itemWidth = barWidth / state.routes.length;
  const indicatorX = useSharedValue(state.index * itemWidth);

  useEffect(() => {
    indicatorX.value = withTiming(state.index * itemWidth, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [indicatorX, itemWidth, state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth - 12,
    transform: [{ translateX: indicatorX.value + 6 }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={[styles.bar, { width: barWidth }]}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : (options.title ?? route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onLongPress={onLongPress}
              onPress={onPress}
              style={styles.item}
              testID={options.tabBarButtonTestID}
            >
              {options.tabBarIcon?.({ focused: isFocused, color, size: 20 })}
              <Text numberOfLines={1} style={[styles.label, { color }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: 0,
    left: 0,
    alignItems: "center",
  },
  bar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#17191C",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 7,
  },
  indicator: {
    position: "absolute",
    top: 5,
    bottom: 5,
    left: 0,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(128, 209, 96, 0.18)",
    backgroundColor: "rgba(128, 209, 96, 0.09)",
  },
  item: {
    height: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Platform.OS === "ios" ? 2 : 1,
  },
  label: {
    fontSize: 9,
    fontWeight: "500",
  },
});
