import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
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
    progress: SharedValue<number>;
}

export const TeacherIcon = ({ progress }: TeacherIconProps) => {
    const posX = useSharedValue(20);
    const posY = useSharedValue(height * 0.2);
    const floatY = useSharedValue(0);
    const rotate = useSharedValue(0);
    const shimmerValue = useSharedValue(-1);

    const wrapperSize = 54;

    const x1 = 20;
    const y1 = height * 0.2;

    const x2 = width - wrapperSize - 20;
    const y2 = height * 0.8 - wrapperSize;

    // 🔥 Smooth position switch based on progress
    useEffect(() => {
        const isFirstHalf = progress.value < 0.5;

        posX.value = withTiming(isFirstHalf ? x1 : x2, {
            duration: 900,
            easing: Easing.out(Easing.exp),
        });

        posY.value = withTiming(isFirstHalf ? y1 : y2, {
            duration: 900,
            easing: Easing.out(Easing.exp),
        });
    }, [progress.value]);

    // 🌊 Floating animation
    useEffect(() => {
        floatY.value = withRepeat(
            withSequence(
                withTiming(-6, { duration: 1500 }),
                withTiming(6, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    // 🔄 Soft rotation
    useEffect(() => {
        rotate.value = withRepeat(
            withSequence(
                withTiming(-4, { duration: 1200 }),
                withTiming(4, { duration: 1200 })
            ),
            -1,
            true
        );
    }, []);

    // ✨ Shimmer
    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(1, { duration: 2500 }),
            -1,
            false
        );
    }, []);

    const teacherStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: posX.value },
                { translateY: posY.value + floatY.value },
                { rotate: `${rotate.value}deg` },
            ],
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 100,
        };
    });

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: interpolate(shimmerValue.value, [-1, 1], [-100, 100]),
            },
        ],
    }));

    return (
        <Animated.View style={teacherStyle}>
            <View style={styles.teacherIconWrapper}>
                <Image
                    source={require("@/assets/banner/icon.jpg")}
                    style={styles.teacherIcon}
                />
                <Animated.View
                    style={[StyleSheet.absoluteFill, shimmerStyle]}
                    pointerEvents="none"
                >
                    <LinearGradient
                        colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={{ flex: 1, width: 60 }}
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
        resizeMode: "contain",
        borderRadius: 27,
    },
    teacherIconWrapper: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.9)",
        overflow: "hidden",
        backgroundColor: "#000",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
});