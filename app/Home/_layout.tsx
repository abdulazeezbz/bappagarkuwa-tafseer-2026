import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useRouter, useSegments } from "expo-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  ActivityIndicator,
  Animated,
  Image,
  NativeModules,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import {
  getMiniControllerSnapshot,
  subscribeMiniController,
} from "../../components/_mini-controller-bridge";

export default function HomeTabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const palette = Colors[isDark ? "dark" : "light"];
  const router = useRouter();
  const segments = useSegments();
  const isHighlights = (segments as string[]).includes("highlights");
  const mini = useSyncExternalStore(
    subscribeMiniController,
    getMiniControllerSnapshot,
    getMiniControllerSnapshot,
  );
  const [miniDismissed, setMiniDismissed] = useState(false);
  const [isDraggingMini, setIsDraggingMini] = useState(false);
  const miniSize = 66;
  const miniMargin = 12;
  const miniX = useRef(new Animated.Value(miniMargin)).current;
  const miniY = useRef(new Animated.Value(220)).current;
  const miniScale = useRef(new Animated.Value(1)).current;
  const miniPosRef = useRef({ x: miniMargin, y: 220 });
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const miniBounds = useMemo(() => {
    const left = miniMargin;
    const right = Math.max(miniMargin, screenWidth - miniSize - miniMargin);
    const minY = 90;
    const maxY = Math.max(minY, screenHeight - miniSize - 110);

    return { left, right, minY, maxY };
  }, [miniMargin, miniSize, screenHeight, screenWidth]);
  const dismissZoneTop = Math.max(24, Math.round(screenHeight * 0.25) - 28);
  const dismissZoneHeight = dismissZoneTop + 64;

  const showMini =
    mini.hasActiveAudio && !mini.isPlayerUiVisible && !miniDismissed;

  if (Platform.OS === "android") {
    NativeModules.StatusBarManager.setHidden(true);
  }

  useEffect(() => {
    if (!mini.hasActiveAudio) {
      setMiniDismissed(false);
    }
  }, [mini.hasActiveAudio]);

  useEffect(() => {
    // Reset dismissal whenever the track (banner) changes so it reappears
    setMiniDismissed(false);
  }, [mini.bannerSource]);

  useEffect(() => {
    if (mini.isPlaying && showMini) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(miniScale, {
            toValue: 1.04,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(miniScale, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }

    miniScale.setValue(1);
  }, [mini.isPlaying, miniScale, showMini]);

  useEffect(() => {
    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));
    miniX.stopAnimation((x) => {
      miniY.stopAnimation((y) => {
        const nextY = clamp(y, miniBounds.minY, miniBounds.maxY);
        const snapX =
          x + miniSize / 2 < screenWidth / 2
            ? miniBounds.left
            : miniBounds.right;

        miniX.setValue(snapX);
        miniY.setValue(nextY);
        miniPosRef.current = { x: snapX, y: nextY };
      });
    });
  }, [
    miniBounds.left,
    miniBounds.maxY,
    miniBounds.minY,
    miniBounds.right,
    miniSize,
    miniX,
    miniY,
    screenWidth,
  ]);

  const miniPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
        onPanResponderGrant: () => {
          setIsDraggingMini(true);
        },
        onPanResponderMove: (_, g) => {
          const clamp = (value: number, min: number, max: number) =>
            Math.max(min, Math.min(max, value));
          miniX.setValue(
            clamp(
              miniPosRef.current.x + g.dx,
              miniBounds.left,
              miniBounds.right,
            ),
          );
          miniY.setValue(
            clamp(
              miniPosRef.current.y + g.dy,
              miniBounds.minY,
              miniBounds.maxY,
            ),
          );
        },
        onPanResponderRelease: (_, g) => {
          setIsDraggingMini(false);
          const clamp = (value: number, min: number, max: number) =>
            Math.max(min, Math.min(max, value));
          const releaseX = clamp(
            miniPosRef.current.x + g.dx,
            miniBounds.left,
            miniBounds.right,
          );
          const releaseY = clamp(
            miniPosRef.current.y + g.dy,
            miniBounds.minY,
            miniBounds.maxY,
          );
          const centerX = releaseX + miniSize / 2;
          const withinDismissX = Math.abs(centerX - screenWidth / 2) < 110;
          const withinDismissY = releaseY <= dismissZoneTop + 54;
          const shouldDismiss = withinDismissX && withinDismissY;

          if (shouldDismiss) {
            setMiniDismissed(true);
            miniPosRef.current = { x: releaseX, y: releaseY };
            miniX.setValue(releaseX);
            miniY.setValue(releaseY);
            return;
          }

          const snapX =
            releaseX + miniSize / 2 < screenWidth / 2
              ? miniBounds.left
              : miniBounds.right;
          miniPosRef.current = { x: snapX, y: releaseY };

          Animated.parallel([
            Animated.spring(miniX, {
              toValue: snapX,
              tension: 160,
              friction: 16,
              useNativeDriver: true,
            }),
            Animated.spring(miniY, {
              toValue: releaseY,
              tension: 160,
              friction: 16,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [
      dismissZoneTop,
      miniBounds.left,
      miniBounds.maxY,
      miniBounds.minY,
      miniBounds.right,
      miniSize,
      miniX,
      miniY,
      screenWidth,
    ],
  );

  const onMiniLongPress = () => {
    mini.onOpenPlayerUi?.();
    router.push("/Home");
  };

  const onMiniPress = () => {
    if (isDraggingMini) return;
    void mini.onTogglePlayPause?.();
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: palette.tint,
          tabBarInactiveTintColor: palette.icon,
          tabBarStyle: {
            display: isHighlights ? "none" : "flex",
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 55,
            height: 68,
            marginHorizontal: 20,
            borderRadius: 22,
            borderTopWidth: 0,
            backgroundColor: isDark
              ? "rgba(19, 41, 28, 0.96)"
              : "rgba(255, 255, 255, 0.96)",
            elevation: 10,
            boxShadow: isDark
              ? "0px 6px 12px rgba(117, 250, 55, 0.35)"
              : "0px 6px 12px rgba(0, 0, 0, 0.53)",
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "700",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Tafseer",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={
                  focused
                    ? "book-open-page-variant"
                    : "book-open-page-variant-outline"
                }
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="gallery"
          options={{
            title: "Moments",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "image-multiple" : "image-multiple-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="highlights"
          options={{
            title: "Highlights",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "play-circle" : "play-circle-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tabs>

      {showMini ? (
        <>
          {isDraggingMini ? (
            <View
              style={[styles.dismissTargetWrap, { top: dismissZoneTop }]}
              pointerEvents="none"
            >
              <View
                style={[
                  styles.dismissTopZone,
                  {
                    top: -dismissZoneTop,
                    height: dismissZoneHeight,
                    backgroundColor: isDark
                      ? "rgba(180, 35, 35, 0.26)"
                      : "rgba(220, 24, 24, 0.18)",
                  },
                ]}
              />
              <View
                style={[
                  styles.dismissTargetBackdrop,
                  {
                    backgroundColor: isDark
                      ? "rgba(7, 18, 12, 0.68)"
                      : "rgba(255, 255, 255, 0.78)",
                    borderColor: isDark ? "#2b5a43" : "#b8dcc8",
                  },
                ]}
              />
              <View
                style={[
                  styles.dismissTarget,
                  {
                    backgroundColor: isDark
                      ? "rgba(157, 215, 181, 0.2)"
                      : "rgba(22, 148, 74, 0.14)",
                    borderColor: isDark ? "#b9f0cf" : "#16944a",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={isDark ? "#d9ffe8" : "#12753b"}
                />
                <View style={styles.dismissLabelWrap}>
                  <MaterialCommunityIcons
                    name="arrow-down"
                    size={13}
                    color={isDark ? "#d9ffe8" : "#12753b"}
                  />
                  <Animated.Text
                    style={[
                      styles.dismissLabel,
                      { color: isDark ? "#d9ffe8" : "#12753b" },
                    ]}
                  >
                    Drop here to close
                  </Animated.Text>
                </View>
              </View>
            </View>
          ) : null}

          <Animated.View
            {...miniPanResponder.panHandlers}
            style={[
              styles.miniWrap,
              {
                transform: [
                  { translateX: miniX },
                  { translateY: miniY },
                  { scale: miniScale },
                ],
              },
            ]}
          >
            <Pressable
              style={[
                styles.miniButton,
                {
                  backgroundColor: isDark
                    ? "rgba(19, 41, 28, 0.96)"
                    : "rgba(255, 255, 255, 0.96)",
                  borderColor: "rgba(22, 148, 74, 0.6)",
                },
              ]}
              onPress={onMiniPress}
              onLongPress={onMiniLongPress}
              delayLongPress={200}
            >
              {mini.bannerSource ? (
                <Image source={mini.bannerSource} style={styles.miniImage} />
              ) : (
                <View style={styles.miniFallback}>
                  <MaterialCommunityIcons name="music" size={26} color="#fff" />
                </View>
              )}
              {mini.isBuffering ? (
                <View style={styles.miniOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              ) : (
                <View style={styles.miniOverlay}>
                  <MaterialCommunityIcons
                    name={mini.isPlaying ? "pause" : "play"}
                    size={18}
                    color="#fff"
                  />
                </View>
              )}
            </Pressable>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  miniWrap: {
    position: "absolute",
    zIndex: 40,
    elevation: 25,
  },
  miniButton: {
    width: 66,
    height: 66,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 5px 9px rgba(0, 0, 0, 0.22)",
  },
  miniImage: {
    width: 56,
    height: 56,
    borderRadius: 999,
  },
  miniFallback: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16944a",
  },
  miniOverlay: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#16944a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  dismissTargetWrap: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    zIndex: 50,
    justifyContent: "center",
  },
  dismissTopZone: {
    position: "absolute",
    width: "100%",
  },
  dismissTargetBackdrop: {
    position: "absolute",
    width: 220,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
  },
  dismissTarget: {
    width: 200,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  dismissLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dismissLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
