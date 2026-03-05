import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

interface VideoItemProps {
    videoUrl: string;
    username: string;
    title: string;
    isPaused: boolean;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const VideoItem = ({
    videoUrl,
    username,
    title,
    isPaused,
}: VideoItemProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    // Video Player
    const player = useVideoPlayer(videoUrl, (p) => {
        p.loop = true;
        if (!isPaused) p.play();
    });
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const progress = useSharedValue(0);

    // Teacher Icon Animation Values
    const teacherShake = useSharedValue(0);

    // Double Tap Logic
    const lastTap = useRef<number>(0);
    const [showSeekFeedback, setShowSeekFeedback] = useState<"forward" | "backward" | null>(null);

    // Shimmer Animation for Teacher Icon
    const shimmerValue = useSharedValue(-1);

    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(1, { duration: 2500 }),
            -1,
            false
        );
    }, [shimmerValue]);

    useEffect(() => {
        if (isPaused) {
            player.pause();
        } else {
            player.play();
        }
    }, [isPaused, player]);

    useEffect(() => {
        // Sync initial playing state
        setIsPlaying(player.playing);

        // Update total duration if already available
        if (player.duration > 0) setTotalDuration(player.duration);

        const playingSubscription = player.addListener("playingChange", (event) => {
            setIsPlaying(event.isPlaying);
        });

        const statusSubscription = player.addListener("statusChange", (event) => {
            if (event.status === "readyToPlay") {
                setTotalDuration(player.duration);
                if (!isPaused) player.play(); // Start playing when ready, if not paused
            }
        });

        // Progress listener
        const timeUpdateSubscription = player.addListener("timeUpdate", (event) => {
            if (player.duration > 0) {
                const p = event.currentTime / player.duration;
                progress.value = p;
                setCurrentTime(event.currentTime);

                // Update total duration if it's still 0 (fallback)
                setTotalDuration(prev => prev === 0 ? player.duration : prev);
            }
        });

        // Start teacher shake
        teacherShake.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 100 }),
                withTiming(5, { duration: 100 }),
                withTiming(0, { duration: 100 })
            ),
            -1, // infinite
            true
        );

        return () => {
            playingSubscription.remove();
            statusSubscription.remove();
            timeUpdateSubscription.remove();
        };
    }, [player, progress, teacherShake, isPaused]);

    const handlePress = (side: "left" | "right") => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            // DOUBLE TAP detected
            if (side === "left") {
                player.seekBy(-10);
                setShowSeekFeedback("backward");
            } else {
                player.seekBy(10);
                setShowSeekFeedback("forward");
            }
            setTimeout(() => setShowSeekFeedback(null), 500);
        } else {
            // SINGLE TAP
            if (player.playing) {
                player.pause();
            } else {
                player.play();
            }
        }
        lastTap.current = now;
    };

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    const teacherStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${teacherShake.value}deg` }
            ],
            position: 'absolute',
            left: 16,
            bottom: 155, // Positioned right above the username metadata
            zIndex: 100,
        };
    });

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: interpolate(shimmerValue.value, [-1, 1], [-100, 100]) }],
    }));

    return (
        <View style={styles.container}>
            {/* Interaction Layer */}
            <View style={styles.interactionLayer}>
                <Pressable
                    style={styles.controlSide}
                    onPress={() => handlePress("left")}
                />
                <Pressable
                    style={styles.controlSide}
                    onPress={() => handlePress("right")}
                />
            </View>

            <VideoView
                style={styles.video}
                player={player}
                contentFit="cover"
                nativeControls={false} // Hide default controls
            />

            {/* Teacher Icon */}
            <Animated.View style={teacherStyle}>
                <View style={styles.teacherIconWrapper}>
                    <Image
                        source={require("@/assets/banner/icon.jpg")}
                        style={styles.teacherIcon}
                    />
                    <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle, { pointerEvents: 'none' }]}>
                        <LinearGradient
                            colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={{ flex: 1, width: 60, height: '100%' }}
                        />
                    </Animated.View>
                </View>
            </Animated.View>

            {/* Seek Feedback */}
            {showSeekFeedback && (
                <View style={styles.seekFeedback}>
                    <MaterialCommunityIcons
                        name={showSeekFeedback === "forward" ? "fast-forward" : "rewind"}
                        size={40}
                        color="rgba(255,255,255,0.8)"
                    />
                    <Text style={styles.seekText}>{showSeekFeedback === "forward" ? "+10s" : "-10s"}</Text>
                </View>
            )}

            {/* Metadata Overlays */}
            <View style={styles.overlay} pointerEvents="none">
                <View style={styles.bottomContent}>
                    <View style={styles.userRow}>
                        <Text style={styles.username}>@{username}</Text>
                        <MaterialCommunityIcons name="check-decagram" size={16} color="#3897f0" style={styles.verifyIcon} />
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                        {title}
                    </Text>

                    {/* Timer */}
                    <View style={styles.timerPill}>
                        <Text style={styles.timerText}>
                            {formatTime(currentTime)} / {formatTime(totalDuration)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Progress Bar (TikTok style) */}
            <View style={styles.progressContainer}>
                <Animated.View style={[styles.progressBar, progressStyle]} />
            </View>

            {/* Large Play Icon when paused */}
            {!isPlaying && (
                <View style={styles.centeredOverlay} pointerEvents="none">
                    <MaterialCommunityIcons name="play" size={80} color="rgba(255,255,255,0.4)" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height,
        backgroundColor: "#000",
    },
    video: {
        flex: 1,
    },
    interactionLayer: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: "row",
        zIndex: 50,
    },
    controlSide: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
        paddingBottom: 80,
        paddingHorizontal: 16,
        zIndex: 60,
    },
    bottomContent: {
        width: "100%",
        gap: 6,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    username: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    verifyIcon: {
        marginTop: 2,
    },
    title: {
        color: "#fff",
        fontSize: 14,
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    timerPill: {
        backgroundColor: "rgba(0,0,0,0.4)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "flex-start",
        marginTop: 4,
    },
    timerText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    progressContainer: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        height: 2,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        zIndex: 70,
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#fff",
    },
    centeredOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 55,
    },
    teacherIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
    },
    teacherIconWrapper: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.9)",
        overflow: 'hidden',
        backgroundColor: '#000',
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    seekFeedback: {
        position: 'absolute',
        top: '45%',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
    },
    seekText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
        textShadowColor: '#000',
        textShadowRadius: 5,
    }
});
