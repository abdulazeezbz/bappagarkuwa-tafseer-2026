import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import Toast from "react-native-toast-message";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { setMiniControllerSnapshot } from "../../components/_mini-controller-bridge";

type AudioItem = {
  id: string;
  title: string;
  source: string; // URL string
  banner: any;    // require() result is usually a number but can be an object
};

const audioFiles: AudioItem[] = [
  {
    id: "1",
    title: "Ramadan Tafseer - Day 01",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_1_sc32zq.mp3",
    banner: require("@/assets/banner/day_1.jpg"),
  },
  {
    id: "2",
    title: "Ramadan Tafseer - Day 02",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538775/day_2.mp3", // Placeholder URL based on pattern if known, or just a sample
    banner: require("@/assets/banner/day_2.jpg"),
  },
  {
    id: "3",
    title: "Ramadan Tafseer - Day 03",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_3.mp3",
    banner: require("@/assets/banner/day_3.jpg"),
  },
  {
    id: "4",
    title: "Ramadan Tafseer - Day 04",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_4.mp3",
    banner: require("@/assets/banner/day_4.jpg"),
  },
  {
    id: "5",
    title: "Ramadan Tafseer - Day 05",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_5.mp3",
    banner: require("@/assets/banner/day_5.jpg"),
  },
  {
    id: "6",
    title: "Ramadan Tafseer - Day 06",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_6.mp3",
    banner: require("@/assets/banner/day_6.jpg"),
  },
  {
    id: "7",
    title: "Ramadan Tafseer - Day 07",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_7.mp3",
    banner: require("@/assets/banner/day_7.jpg"),
  },
  {
    id: "8",
    title: "Ramadan Tafseer - Day 08",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_8.mp3",
    banner: require("@/assets/banner/day_8.jpg"),
  },
  {
    id: "10",
    title: "Ramadan Tafseer - Day 10",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_10.mp3",
    banner: require("@/assets/banner/day_10.jpg"),
  },
  {
    id: "11",
    title: "Ramadan Tafseer - Day 11",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_11.mp3",
    banner: require("@/assets/banner/day_11.jpg"),
  },

  {
    id: "13",
    title: "Ramadan Tafseer - Day 13",
    source: "https://res.cloudinary.com/dpjni6fdl/video/upload/v1772538042/day_13.mp3",
    banner: require("@/assets/banner/day_13.jpg"),
  },
];

export default function TafseerScreen() {
  const scheme = useColorScheme() ?? "light";
  const isDark = scheme === "dark";
  const palette = Colors[scheme];
  const navigation = useNavigation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [durations, setDurations] = useState<Record<string, string>>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [timelineWidth, setTimelineWidth] = useState(1);
  const [hasActiveAudio, setHasActiveAudio] = useState(false);

  const currentIndexRef = useRef(0);
  const playerRef = useRef<AudioPlayer | null>(null);
  const statusRef = useRef<AudioStatus | null>(null);
  const playbackSubRef = useRef<{ remove: () => void } | null>(null);
  const loadingIdRef = useRef<string | null>(null);
  const toggleLockRef = useRef(false);
  const lastToggleAtRef = useRef(0);
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const vizValue = useRef(new Animated.Value(0)).current;
  const vizLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentAudio = audioFiles[currentIndex];
  const spectrumSegments = useMemo(
    () => Array.from({ length: 44 }, (_, i) => i),
    [],
  );
  const spectrumBarWidth = 5;
  const spectrumBarGap = 4;
  const spectrumRailWidth =
    spectrumSegments.length * (spectrumBarWidth + spectrumBarGap);

  const favoriteAudios = useMemo(
    () => audioFiles.filter((item) => favoriteIds.includes(item.id)),
    [favoriteIds],
  );

  const unloadPlayer = useCallback(() => {
    if (playbackSubRef.current) {
      playbackSubRef.current.remove();
      playbackSubRef.current = null;
    }

    if (playerRef.current) {
      try {
        const p = playerRef.current;
        p.pause();
        p.clearLockScreenControls();
        p.remove();
      } catch (e) {
        console.warn("Error unloading player:", e);
      }
      playerRef.current = null;
    }

    statusRef.current = null;
    setIsPlaying(false);
    setIsBuffering(false);
    setPositionMillis(0);
    setDurationMillis(0);
    // Note: don't setHasActiveAudio(false) here if we're just switching tracks
  }, []);

  const loadAndPlay = useCallback(
    async (index: number, shouldPlay = true) => {
      const safeIndex = (index + audioFiles.length) % audioFiles.length;
      const selected = audioFiles[safeIndex];
      const loadingId = Date.now().toString();
      loadingIdRef.current = loadingId;

      // Don't fully unload if we're just switching tracks to keep mini player visible
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch (e) {
          console.warn("Error pausing prior player:", e);
        }
      }

      setIsPlaying(false);
      setIsBuffering(true); // Set buffering true while loading new track
      setHasActiveAudio(true); // Keep active so mini player stays
      spinValue.setValue(0);
      vizValue.setValue(0);

      try {
        // --- CACHING LOGIC ---
        const filename = `audio_${selected.id}.mp3`;
        const cacheDir = FileSystem.cacheDirectory + "audio_cache/";
        const fileUri = cacheDir + filename;

        // Ensure cache directory exists
        const dirInfo = await FileSystem.getInfoAsync(cacheDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        }

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        let audioSource: string = selected.source;

        if (fileInfo.exists) {
          console.log(`[AudioCache] Cache hit: ${filename}`);
          audioSource = fileUri;
        } else {
          console.log(`[AudioCache] Cache miss: ${selected.source}`);
          // Start download in background for next time
          FileSystem.downloadAsync(selected.source, fileUri)
            .then(() => console.log(`[AudioCache] Finished caching: ${filename}`))
            .catch((err: Error) =>
              console.error("[AudioCache] Download failed:", err),
            );
        }
        // ---------------------

        const player = createAudioPlayer(audioSource, {
          updateInterval: 300,
        });

        // Race condition check: if a newer load request started, ignore this one
        if (loadingIdRef.current !== loadingId) {
          player.remove();
          return;
        }

        playerRef.current = player;
        currentIndexRef.current = safeIndex;
        setCurrentIndex(safeIndex);
        setHasActiveAudio(true);

        playbackSubRef.current = player.addListener(
          "playbackStatusUpdate",
          (status: AudioStatus) => {
            if (loadingIdRef.current !== loadingId) return;
            statusRef.current = status;
            if (!status.isLoaded) {
              setIsBuffering(true); // Still buffering if not loaded
              return;
            }

            setIsPlaying(status.playing);
            setIsBuffering(status.isBuffering);
            setPositionMillis(Math.floor(status.currentTime * 1000));
            setDurationMillis(Math.floor(status.duration * 1000));

            // Auto-play if requested and just loaded
            if (
              shouldPlay &&
              status.isLoaded &&
              !status.playing &&
              status.currentTime === 0
            ) {
              player.play();
            }

            if (status.didJustFinish) {
              void loadAndPlay(safeIndex + 1, true);
            }
          },
        );

        // NATIVE NOTIFICATION LISTENERS
        player.setActiveForLockScreen(
          true,
          {
            title: selected.title,
            artist: "Ramadan Tafseer 2026/1448",
            artworkUrl: Image.resolveAssetSource(selected.banner).uri,
          },
          {
            showSeekBackward: true,
            showSeekForward: true,
          },
        );
      } catch (error) {
        console.error("Failed to load audio:", error);
        setHasActiveAudio(false);
        setIsBuffering(false);

        Toast.show({
          type: "error",
          text1: "Audio Error",
          text2: "Failed to load audio. Please check your internet connection.",
          position: "bottom",
          bottomOffset: 120,
        });
      }
    },
    [unloadPlayer],
  );

  const togglePlayPause = useCallback(async () => {
    const now = Date.now();
    if (toggleLockRef.current || now - lastToggleAtRef.current < 250) {
      return;
    }
    toggleLockRef.current = true;
    lastToggleAtRef.current = now;

    try {
      if (!playerRef.current) {
        await loadAndPlay(currentIndexRef.current, true);
        setPlayerVisible(true);
        return;
      }

      if (!statusRef.current?.isLoaded) {
        // If not loaded yet, just wait for the listener to trigger play
        // or try to play if it was supposed to
        return;
      }

      if (playerRef.current.playing) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    } catch (error) {
      console.error("Error in togglePlayPause:", error);
    } finally {
      setTimeout(() => {
        toggleLockRef.current = false;
      }, 180);
    }
  }, [loadAndPlay]);

  const goNext = useCallback(async () => {
    await loadAndPlay(currentIndexRef.current + 1, true);
  }, [loadAndPlay]);

  const goPrevious = useCallback(async () => {
    await loadAndPlay(currentIndexRef.current - 1, true);
  }, [loadAndPlay]);

  const skipForward = useCallback(async () => {
    if (playerRef.current && statusRef.current?.isLoaded) {
      const nextPos = Math.min(statusRef.current.duration, statusRef.current.currentTime + 30);
      await playerRef.current.seekTo(nextPos);
    }
  }, []);

  const jumpBackward = useCallback(async () => {
    if (playerRef.current && statusRef.current?.isLoaded) {
      const nextPos = Math.max(0, statusRef.current.currentTime - 10);
      await playerRef.current.seekTo(nextPos);
    }
  }, []);

  const openPlayer = useCallback(
    async (index: number) => {
      if (
        index === currentIndexRef.current &&
        playerRef.current &&
        playerRef.current.isLoaded
      ) {
        setPlayerVisible(true);
        return;
      }

      await loadAndPlay(index, true);
      setPlayerVisible(true);
    },
    [loadAndPlay],
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
    );
  }, []);

  const seekToRatio = useCallback(
    async (ratio: number) => {
      if (!playerRef.current || !statusRef.current?.isLoaded) return;
      const nextPosition = Math.max(
        0,
        Math.min(durationMillis, Math.floor(durationMillis * ratio)),
      );
      await playerRef.current.seekTo(nextPosition / 1000);
    },
    [durationMillis],
  );

  const onTimelinePress = useCallback(
    async (event: GestureResponderEvent) => {
      const ratio = event.nativeEvent.locationX / timelineWidth;
      await seekToRatio(ratio);
    },
    [seekToRatio, timelineWidth],
  );

  const onTimelineLayout = useCallback((event: LayoutChangeEvent) => {
    setTimelineWidth(event.nativeEvent.layout.width || 1);
  }, []);

  const baseTabBarStyle = useMemo(
    () => ({
      position: "absolute" as const,
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
    }),
    [isDark],
  );

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    });

    // Android 13+ Notification Permission Request
    const requestNotificationPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
        } catch (err) {
          console.warn('Notification permission error:', err);
        }
      }
    };
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: playerVisible ? { display: "none" } : baseTabBarStyle,
    });

    return () => {
      navigation.setOptions({ tabBarStyle: baseTabBarStyle });
    };
  }, [baseTabBarStyle, navigation, playerVisible]);

  useEffect(() => {
    const onBackPress = () => {
      if (!playerVisible) return false;
      setPlayerVisible(false);
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [playerVisible]);

  useEffect(() => {
    let active = true;

    const loadDurationFromSource = async (source: string) => {
      return await new Promise<number | null>((resolve) => {
        try {
          const probe = createAudioPlayer(source, { updateInterval: 200 });
          let done = false;

          const finish = (value: number | null) => {
            if (done) return;
            done = true;
            subscription.remove();
            probe.remove();
            clearTimeout(timer);
            resolve(value);
          };

          const subscription = probe.addListener(
            "playbackStatusUpdate",
            (status: AudioStatus) => {
              if (status.isLoaded && status.duration > 0) {
                finish(Math.round(status.duration * 1000));
              }
            },
          );

          const timer = setTimeout(() => finish(null), 10000); // Increased timeout for online audio
        } catch (e) {
          console.error("Duration probe failed:", e);
          resolve(null);
        }
      });
    };

    const loadDurations = async () => {
      const results: Record<string, string> = {};

      // Process sequential to avoid resource overload
      for (const audio of audioFiles) {
        if (!active) break;
        try {
          const duration = await loadDurationFromSource(audio.source);
          results[audio.id] = duration != null ? formatDuration(duration) : "--:--";
        } catch (error) {
          console.error(`Error loading duration for ${audio.title}:`, error);
          results[audio.id] = "--:--";
        }
      }

      if (active) {
        setDurations(results);
      }
    };

    void loadDurations();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (spinLoopRef.current) {
        spinLoopRef.current.stop();
        spinLoopRef.current = null;
      }
      return;
    }

    spinValue.stopAnimation((value) => {
      spinValue.setValue(value % 1);
      spinLoopRef.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        { resetBeforeIteration: true },
      );
      spinLoopRef.current.start();
    });

    return () => {
      if (spinLoopRef.current) {
        spinLoopRef.current.stop();
        spinLoopRef.current = null;
      }
    };
  }, [isPlaying, spinValue]);

  useEffect(() => {
    if (!isPlaying || !playerVisible) {
      if (vizLoopRef.current) {
        vizLoopRef.current.stop();
        vizLoopRef.current = null;
      }
      vizValue.setValue(0);
      return;
    }

    vizValue.setValue(0);
    vizLoopRef.current = Animated.loop(
      Animated.timing(vizValue, {
        toValue: 1,
        duration: 5800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true },
    );
    vizLoopRef.current.start();

    return () => {
      if (vizLoopRef.current) {
        vizLoopRef.current.stop();
        vizLoopRef.current = null;
      }
    };
  }, [isPlaying, playerVisible, vizValue]);

  useEffect(() => {
    return () => {
      unloadPlayer();
    };
  }, [unloadPlayer]);

  useEffect(() => {
    setMiniControllerSnapshot({
      hasActiveAudio,
      isPlaying,
      isBuffering,
      isPlayerUiVisible: playerVisible,
      bannerSource: currentAudio?.banner ?? null,
      onTogglePlayPause: togglePlayPause,
      onOpenPlayerUi: () => setPlayerVisible(true),
    });
  }, [currentAudio, hasActiveAudio, isPlaying, isBuffering, playerVisible, togglePlayPause]);

  useEffect(() => {
    return () => {
      setMiniControllerSnapshot({
        hasActiveAudio: false,
        isPlaying: false,
        isBuffering: false,
        isPlayerUiVisible: false,
        bannerSource: null,
        onTogglePlayPause: null,
        onOpenPlayerUi: null,
      });
    };
  }, []);

  const progressRatio =
    durationMillis > 0 ? positionMillis / durationMillis : 0;
  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const titleMarqueeX = vizValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -spectrumRailWidth],
  });

  if (playerVisible) {
    return (
      <ThemedView
        style={[
          styles.screen,
          { backgroundColor: scheme === "dark" ? "#07120c" : "#eef9f1" },
        ]}
      >
        <View style={styles.playerTop}>
          <Pressable
            style={styles.hideBtn}
            onPress={() => setPlayerVisible(false)}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={palette.text}
            />
            <ThemedText style={styles.hideBtnText}>Hide Player</ThemedText>
          </Pressable>

          <Pressable
            style={styles.topFavBtn}
            onPress={() => toggleFavorite(currentAudio.id)}
          >
            <MaterialCommunityIcons
              name={
                favoriteIds.includes(currentAudio.id)
                  ? "heart"
                  : "heart-outline"
              }
              size={20}
              color={
                favoriteIds.includes(currentAudio.id) ? "#ff4d7d" : palette.text
              }
            />
            <ThemedText style={styles.topFavText}>Favorite</ThemedText>
          </Pressable>
        </View>

        <View style={styles.playerBody}>
          <Animated.View style={[styles.discWrap, { transform: [{ rotate }] }]}>
            <Image source={currentAudio.banner} style={styles.discImage} />
            <View style={styles.discCenter} />
          </Animated.View>

          <View style={styles.playerMeta}>
            <View style={styles.titleSpectrumViewport}>
              <Animated.View
                style={[
                  styles.titleSpectrumRail,
                  { transform: [{ translateX: titleMarqueeX }] },
                ]}
              >
                {[0, 1].map((copy) =>
                  spectrumSegments.map((segment) => (
                    <View
                      key={`title-spectrum-${copy}-${segment}`}
                      style={[
                        styles.titleSpectrumBar,
                        {
                          width: spectrumBarWidth,
                          marginRight: spectrumBarGap,
                          height: 8 + ((segment * 5 + copy * 3) % 8) * 2,
                          opacity: 0.28 + ((segment + copy) % 5) * 0.14,
                        },
                      ]}
                    />
                  )),
                )}
              </Animated.View>
            </View>
            <ThemedText type="subtitle" style={styles.playerTitle}>
              {currentAudio.title}
            </ThemedText>
            <ThemedText style={styles.playerSubtitle}>
              Ramadan Tafseer 2026/1448
            </ThemedText>
          </View>

          <View style={styles.timelineWrap}>
            <Pressable
              style={styles.timelineTrack}
              onLayout={onTimelineLayout}
              onPress={onTimelinePress}
            >
              <View
                style={[
                  styles.timelineProgress,
                  { width: `${progressRatio * 100}%` },
                ]}
              />
              <View
                style={[
                  styles.timelineThumb,
                  { left: `${progressRatio * 100}%` },
                ]}
              />
            </Pressable>
            <View style={styles.timelineTimes}>
              <ThemedText style={styles.timelineText}>
                {formatDuration(positionMillis)}
              </ThemedText>
              <ThemedText style={styles.timelineText}>
                {formatDuration(durationMillis)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <Pressable style={styles.circleBtn} onPress={goPrevious}>
              <MaterialCommunityIcons
                name="skip-previous"
                size={28}
                color={palette.text}
              />
            </Pressable>

            <Pressable style={styles.circleBtn} onPress={jumpBackward}>
              <MaterialCommunityIcons
                name="rewind-10"
                size={22}
                color={palette.text}
              />
            </Pressable>

            <Pressable style={styles.playBtn} onPress={togglePlayPause}>
              {isBuffering ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <MaterialCommunityIcons
                  name={isPlaying ? "pause" : "play"}
                  size={34}
                  color="#ffffff"
                />
              )}
            </Pressable>

            <Pressable style={styles.circleBtn} onPress={skipForward}>
              <MaterialCommunityIcons
                name="fast-forward-30"
                size={22}
                color={palette.text}
              />
            </Pressable>

            <Pressable style={styles.circleBtn} onPress={goNext}>
              <MaterialCommunityIcons
                name="skip-next"
                size={28}
                color={palette.text}
              />
            </Pressable>
          </View>

          <View style={styles.bottomActions}>
            <Pressable
              style={styles.bottomAction}
              onPress={() => toggleFavorite(currentAudio.id)}
            >
              <MaterialCommunityIcons
                name={
                  favoriteIds.includes(currentAudio.id)
                    ? "heart"
                    : "heart-outline"
                }
                size={20}
                color={
                  favoriteIds.includes(currentAudio.id)
                    ? "#ff4d7d"
                    : palette.text
                }
              />
              <ThemedText style={styles.bottomActionText}>Favorite</ThemedText>
            </Pressable>

            <View style={styles.bottomAction}>
              <MaterialCommunityIcons
                name="download-outline"
                size={20}
                color={palette.text}
              />
              <ThemedText style={styles.bottomActionText}>Offline</ThemedText>
            </View>
            <Pressable
              style={styles.hideBtn}
              onPress={() => setPlayerVisible(false)}
            >
              <View style={styles.bottomAction}>
                <MaterialCommunityIcons
                  name="playlist-music"
                  size={20}
                  color={palette.text}
                />
                <ThemedText style={styles.bottomActionText}>Queue</ThemedText>
              </View>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor: scheme === "dark" ? "#143524" : "#E9F9EF",
              borderColor: palette.border,
            },
          ]}
        >
          <ThemedText style={styles.heroKicker}>Tafseer Audios</ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Ramadan Tafseer
          </ThemedText>
          <ThemedText style={styles.heroSub}>2026 / 1448</ThemedText>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <SectionTitle title="Favorite Audios" />
          {favoriteAudios.length === 0 ? (
            <ThemedText style={styles.audioIntro}>
              No favorites yet. Add from the audio player.
            </ThemedText>
          ) : (
            favoriteAudios.map((item) => (
              <View key={item.id} style={styles.favoriteRow}>
                <MaterialCommunityIcons
                  name="heart"
                  size={14}
                  color="#ff4d7d"
                />
                <ThemedText style={styles.favoriteText}>
                  {item.title}
                </ThemedText>
              </View>
            ))
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <SectionTitle title="Audio List" />
          <ThemedText style={styles.audioIntro}>
            Tap an audio to open the player.
          </ThemedText>

          {audioFiles.map((audio, index) => (
            <AnimatedAudioCard
              key={audio.id}
              audio={audio}
              index={index}
              scheme={scheme}
              isPlaying={isPlaying && currentAudio.id === audio.id}
              durationText={durations[audio.id] ?? "..."}
              onPress={() => void openPlayer(index)}
            />
          ))}
        </View>

        <View
          style={[
            styles.section,
            styles.hhdd,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <SectionTitle title="Scholar Info" />
          <View style={[styles.scholarCard, { borderColor: palette.border }]}>
            <View style={styles.scholarHeader}>
              <View style={[styles.avatar, { backgroundColor: palette.tint }]}>
                <MaterialCommunityIcons name="account" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.scholarName}>
                  Ustadh Name Here
                </ThemedText>
                <ThemedText style={styles.scholarRole}>
                  Ramadan Tafseer Scholar
                </ThemedText>
              </View>
            </View>

            <View style={styles.metaRow}>
              <ThemedText style={styles.metaLabel}>Email</ThemedText>
              <ThemedText style={styles.metaValue}>
                scholar@email.com
              </ThemedText>
            </View>
            <View style={styles.metaRow}>
              <ThemedText style={styles.metaLabel}>Venue</ThemedText>
              <ThemedText style={styles.metaValue}>
                Mosque Address Here
              </ThemedText>
            </View>
            <View style={styles.metaRow}>
              <ThemedText style={styles.metaLabel}>Daily Time</ThemedText>
              <ThemedText style={styles.metaValue}>
                4:30 PM - 8:00 PM
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function AnimatedAudioCard({
  audio,
  index,
  scheme,
  isPlaying,
  durationText,
  onPress,
}: {
  audio: AudioItem;
  index: number;
  scheme: "light" | "dark";
  isPlaying: boolean;
  durationText: string;
  onPress: () => void;
}) {
  const translateY = useRef(new Animated.Value(18)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 340,
        delay: index * 90,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 340,
        delay: index * 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.audioCard,
          {
            backgroundColor:
              scheme === "dark"
                ? pressed
                  ? "rgba(83, 214, 138, 0.16)"
                  : "rgba(83, 214, 138, 0.08)"
                : pressed
                  ? "rgba(22, 148, 74, 0.12)"
                  : "rgba(22, 148, 74, 0.07)",
            transform: [{ scale: pressed ? 0.985 : 1 }],
            borderWidth: isPlaying ? 1.2 : 0,
            borderColor: "#39d47d",
          },
        ]}
      >
        <View style={styles.bannerWrap}>
          <Image source={audio.banner} style={styles.bannerImage} />
          <View style={styles.playingIconWrap}>
            <MaterialCommunityIcons
              name={isPlaying ? "equalizer" : "play"}
              size={16}
              color="#ffffff"
            />
          </View>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText style={styles.audioTitle}>{audio.title}</ThemedText>
          <ThemedText style={styles.audioMeta}>
            {durationText} | Stream
          </ThemedText>
        </View>

        <View style={styles.offlineBadge}>
          <ThemedText
            lightColor="#ffffff"
            darkColor="#ffffff"
            style={styles.offlineText}
          >
            Offline
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <ThemedText style={styles.sectionTitle}>{title}</ThemedText>;
}

function formatDuration(durationMillis: number) {
  const totalSeconds = Math.floor(durationMillis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  hhdd: {
    marginBottom: 30,
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingTop: 28,
    gap: 12,
    paddingBottom: 110,
  },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 8,
    marginTop: 10,
  },
  heroKicker: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    opacity: 0.85,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 22,
    color: "#16944a",
    fontWeight: "700",
  },
  section: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    marginBottom: -4,
    fontWeight: "800",
  },
  audioIntro: {
    fontSize: 12,
    opacity: 0.82,
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 6,
  },
  favoriteText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scholarCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 10,
  },
  scholarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  scholarName: {
    fontSize: 15,
    fontWeight: "800",
  },
  scholarRole: {
    fontSize: 12,
    opacity: 0.78,
  },
  metaRow: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    opacity: 0.7,
    fontWeight: "700",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  audioCard: {
    marginTop: 8,
    borderRadius: 14,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  playingIconWrap: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "rgba(22, 148, 74, 0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  audioMeta: {
    fontSize: 12,
    opacity: 0.8,
  },
  offlineBadge: {
    borderRadius: 999,
    backgroundColor: "#16944a",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  offlineText: {
    fontWeight: "700",
    letterSpacing: 0.3,
    fontSize: 10,
  },
  playerTop: {
    marginTop: 28,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hideBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  topFavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(22, 148, 74, 0.14)",
  },
  topFavText: {
    fontSize: 12,
    fontWeight: "700",
  },
  playerBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 56,
    alignItems: "center",
    justifyContent: "space-between",
  },
  discWrap: {
    width: 280,
    height: 280,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 10,
    borderColor: "rgba(22, 148, 74, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 8px 18px rgba(22, 148, 74, 0.35)",
    elevation: 8,
  },
  discImage: {
    width: "100%",
    height: "100%",
  },
  discCenter: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#ffffff00",
    borderWidth: 0,
    borderColor: "white",
  },
  playerMeta: {
    marginTop: 18,
    alignItems: "center",
    gap: 5,
  },
  titleSpectrumViewport: {
    width: 290,
    height: 18,
    overflow: "hidden",
    marginBottom: 6,
  },
  titleSpectrumRail: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  titleSpectrumBar: {
    height: 14,
    borderRadius: 3,
    backgroundColor: "#63e79b",
  },
  playerTitle: {
    textAlign: "center",
    fontSize: 24,
    lineHeight: 28,
  },
  playerSubtitle: {
    fontSize: 14,
    opacity: 0.78,
  },
  timelineWrap: {
    width: "100%",
    gap: 8,
  },
  timelineTrack: {
    height: 10,
    backgroundColor: "rgba(128, 128, 128, 0.22)",
    borderRadius: 999,
    overflow: "visible",
    justifyContent: "center",
  },
  timelineProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "#16944a",
  },
  timelineThumb: {
    position: "absolute",
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#16944a",
  },
  timelineTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timelineText: {
    fontSize: 12,
    opacity: 0.82,
    fontWeight: "600",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  circleBtn: {
    width: 54,
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22, 148, 74, 0.12)",
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16944a",
    borderWidth: 2,
    borderColor: "#63e79b",
  },
  bottomActions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  bottomAction: {
    alignItems: "center",
    gap: 4,
  },
  bottomActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
