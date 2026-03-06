import { getMiniControllerSnapshot } from "@/components/_mini-controller-bridge";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    Platform,
    Pressable,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { TeacherIcon } from "./teacher-icon";

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

    // Action states
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // Double Tap Logic
    const lastTap = useRef<number>(0);
    const [showSeekFeedback, setShowSeekFeedback] = useState<"forward" | "backward" | null>(null);

    useEffect(() => {
        if (isPaused) {
            player.pause();
        } else {
            // Pause any currently playing audio when this video starts
            const snap = getMiniControllerSnapshot();
            if (snap.hasActiveAudio && snap.isPlaying && snap.onTogglePlayPause) {
                void snap.onTogglePlayPause();
            }
            // Only play if the player is ready or already playing
            if (player.status === 'readyToPlay' || player.playing) {
                player.play();
            }
        }
    }, [isPaused, player, player.status]);

    useEffect(() => {
        // Initial sync
        setIsPlaying(player.playing);
        if (player.duration > 0) setTotalDuration(player.duration);

        const playingSubscription = player.addListener("playingChange", (event) => {
            setIsPlaying(event.isPlaying);
        });

        const statusSubscription = player.addListener("statusChange", (event) => {
            if (event.status === "readyToPlay") {
                setTotalDuration(player.duration);
                if (!isPaused) player.play();
            }
        });

        const timeUpdateSubscription = player.addListener("timeUpdate", (event) => {
            if (Math.abs(event.currentTime - currentTime) > 1.5) {
                setCurrentTime(event.currentTime);
            }

            if (player.duration > 0) {
                const p = event.currentTime / player.duration;
                progress.value = p;
                setTotalDuration(prev => prev === 0 ? player.duration : prev);
            }
        });

        return () => {
            playingSubscription.remove();
            statusSubscription.remove();
            timeUpdateSubscription.remove();
        };
    }, [player, progress]);

    // HIGH-PRECISION LOCAL TIMER
    useEffect(() => {
        let interval: any;

        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + 1;
                    if (totalDuration > 0 && next >= totalDuration) {
                        return 0;
                    }
                    return next;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, totalDuration]);

    const handlePress = (side: "left" | "right") => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            if (side === "left") {
                player.seekBy(-10);
                setCurrentTime(prev => Math.max(0, prev - 10));
                setShowSeekFeedback("backward");
            } else {
                player.seekBy(10);
                setCurrentTime(prev => Math.min(totalDuration, prev + 10));
                setShowSeekFeedback("forward");
            }
            setTimeout(() => setShowSeekFeedback(null), 500);
        } else {
            if (player.playing) {
                player.pause();
            } else {
                player.play();
            }
        }
        lastTap.current = now;
    };

    // ── Share ───────────────────────────────────────────────────────────────
    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            if (Platform.OS === 'web') {
                if (navigator.share) {
                    await navigator.share({ title, url: videoUrl });
                } else {
                    await navigator.clipboard.writeText(videoUrl);
                    Alert.alert("Copied!", "Video URL copied to clipboard.");
                }
            } else {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                    // Share the direct URL as text via native Share sheet
                    await Share.share({ message: `${title}\n${videoUrl}`, title });
                } else {
                    Alert.alert("Error", "Sharing is not available on this device.");
                }
            }
        } catch (error: any) {
            if (error?.message !== "AbortError" && error?.message !== "User did not share") {
                console.error("Share error:", error);
            }
        } finally {
            setIsSharing(false);
        }
    };

    // ── Download / Save ─────────────────────────────────────────────────────
    const handleDownload = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (Platform.OS === 'web') {
                // Web: trigger a download via hidden anchor
                const a = document.createElement("a");
                a.href = videoUrl;
                a.download = `${title.replace(/\s+/g, "_")}.mp4`;
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                // Native: download to cache then save to media library
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert(
                        "Permission Required",
                        "Please allow access to save videos to your gallery."
                    );
                    return;
                }

                const filename = `${title.replace(/\s+/g, "_")}.mp4`;
                const fileUri = cacheDirectory + filename;

                const downloadResumable = FileSystem.createDownloadResumable(
                    videoUrl,
                    fileUri,
                    {}
                );
                const result = await downloadResumable.downloadAsync();
                if (!result?.uri) throw new Error("Download failed");

                const asset = await MediaLibrary.createAssetAsync(result.uri);
                await MediaLibrary.createAlbumAsync("Bappagarkuwa", asset, false);
                Alert.alert("Saved!", "Video saved to your gallery.");
            }
        } catch (error) {
            console.error("Download error:", error);
            Alert.alert("Error", "Failed to save video. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
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
                nativeControls={false}
            />

            {/* Teacher Icon - Absolute Positioned */}
            <TeacherIcon progress={progress} />

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

            {/* Action Buttons — right side column (gallery style) */}
            <View style={styles.actionButtonsColumn} pointerEvents="box-none">
                {/* Share */}
                <Pressable
                    style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                    onPress={handleShare}
                    disabled={isSharing}
                >
                    <View style={styles.actionIconCircle}>
                        <MaterialCommunityIcons
                            name={isSharing ? "loading" : "share-variant"}
                            size={24}
                            color="#fff"
                        />
                    </View>
                    <Text style={styles.actionLabel}>{isSharing ? "..." : "Share"}</Text>
                </Pressable>

                {/* Download / Save */}
                <Pressable
                    style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                    onPress={handleDownload}
                    disabled={isSaving}
                >
                    <View style={styles.actionIconCircle}>
                        <MaterialCommunityIcons
                            name={isSaving ? "loading" : "download"}
                            size={24}
                            color="#fff"
                        />
                    </View>
                    <Text style={styles.actionLabel}>{isSaving ? "Saving..." : "Save"}</Text>
                </Pressable>
            </View>

            {/* Progress Bar (TikTok style) */}
            <View style={styles.progressContainer}>
                <Animated.View style={[styles.progressBar, progressStyle]} />
            </View>

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
        width: "75%", // leave room for action buttons on the right
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
    // ── Gallery-style action buttons ─────────────────────────────────────────
    actionButtonsColumn: {
        position: "absolute",
        right: 16,
        bottom: 120,
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        zIndex: 65,
    },
    actionButton: {
        alignItems: "center",
        gap: 8,
    },
    actionButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.94 }],
    },
    actionIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    actionLabel: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    // ── Progress bar ─────────────────────────────────────────────────────────
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
        width: 85,
        height: 85,
        marginLeft: -15,
        marginTop: -10,
        resizeMode: 'contain',
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
