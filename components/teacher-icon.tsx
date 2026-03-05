import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import Animated, {
    interpolate,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

interface TeacherIconProps {
    progress: SharedValue<number>; // 0 to 1
}

export const TeacherIcon = ({ progress }: TeacherIconProps) => {
    const teacherShake = useSharedValue(0);
    const shimmerValue = useSharedValue(-1);

    // Shimmer Animation
    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(1, { duration: 2500 }),
            -1,
            false
        );
    }, [shimmerValue]);

    // Shake Animation
    useEffect(() => {
        teacherShake.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 100 }),
                withTiming(5, { duration: 100 }),
                withTiming(0, { duration: 100 })
            ),
            -1,
            true
        );
    }, [teacherShake]);

    // TikTok Dynamic Positioning Logic
    const teacherStyle = useAnimatedStyle(() => {
        const wrapperSize = 54;

        // Quadrant 1: Top Left (20% top, 20px left)
        const x1 = 20;
        const y1 = height * 0.2;

        // Quadrant 2: Bottom Right (20% bottom, 20px right)
        const x2 = width - wrapperSize - 20;
        const y2 = height * 0.8 - wrapperSize;

        // Determine target position based on 50% threshold
        const isFirstHalf = progress.value < 0.5;
        const targetX = isFirstHalf ? x1 : x2;
        const targetY = isFirstHalf ? y1 : y2;

        return {
            transform: [
                { translateX: withTiming(targetX, { duration: 800 }) },
                { translateY: withTiming(targetY, { duration: 800 }) },
                { rotate: `${withTiming(teacherShake.value, { duration: 100 })}deg` }
            ],
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 100,
        };
    });

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: interpolate(shimmerValue.value, [-1, 1], [-100, 100]) }],
    }));

    return (
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
    );
};

const styles = StyleSheet.create({
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
});
