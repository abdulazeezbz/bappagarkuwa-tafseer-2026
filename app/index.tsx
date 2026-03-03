import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";

type Slide = {
  id: number;
  title: string;
  subtitle: string;
  image: any;
};

const slides: Slide[] = [
  {
    id: 1,
    title: "Ramadan Tafseer 1448",
    subtitle: "Welcome to a modern space for Qur'anic TafSeer.",
    image: require("@/assets/images/photos/bg (4).jpg"),
  },
  {
    id: 2,
    title: "Tafseer Gallery",
    subtitle: "Beautiful memories from every Tafseer session in one place.",
    image: require("@/assets/images/photos/bg (6).jpg"),
  },
  {
    id: 3,
    title: "Reels Highlights",
    subtitle: "Short videos from the 2026 Tafseer journey.",
    image: require("@/assets/images/photos/bg (3).jpg"),
  },
];

const AnimatedImageBackground =
  Animated.createAnimatedComponent(ImageBackground);

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const [activeSlide, setActiveSlide] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0.5)).current;
  const zoomAnim = useRef(new Animated.Value(1.03)).current;
  const modalImageScale = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5200);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fadeAnim.setValue(0);
    zoomAnim.setValue(1.08);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(zoomAnim, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeSlide, fadeAnim, zoomAnim]);

  const slide = slides[activeSlide];

  const [modalVisible, setModalVisible] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const closeModal = () => {
    setModalVisible(false);
    setIsImageZoomed(false);
    modalImageScale.setValue(1);
  };

  const handleModalImageTap = () => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 350;
    lastTapRef.current = now;

    if (!isDoubleTap) return;

    const nextZoom = !isImageZoomed;
    setIsImageZoomed(nextZoom);

    Animated.spring(modalImageScale, {
      toValue: nextZoom ? 2 : 1,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
  };
  return (
    <View style={styles.screen}>
      <AnimatedImageBackground
        source={slide.image}
        resizeMode="cover"
        style={[
          styles.background,
          { opacity: fadeAnim, transform: [{ scale: zoomAnim }] },
        ]}
        imageStyle={styles.image}
      >
        <View style={styles.overlay}>
          <View style={styles.topChip}>
            <ThemedText style={styles.topChipText}>
              Assalamu Alaikum!
            </ThemedText>
          </View>

          <View style={styles.contentBlock}>
            <ThemedText type="title" style={styles.title}>
              {slide.title}
            </ThemedText>

            <ThemedText style={styles.subtitle}>{slide.subtitle}</ThemedText>

            <View style={styles.tagsRow}>
              <Tag label="Tafseer" />
              <Tag label="Gallery" />
              <Tag label="Short Videos" />
            </View>

            <ThemedView
              style={{
                padding: 15,
                borderRadius: 14,
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.36)"
                  : "rgba(0, 0, 0, 0.36)",
                marginTop: 10,
                borderWidth: 0.8,
                borderStyle: "dotted",
                borderColor: isDark
                  ? "rgba(0, 0, 0, 0.4)"
                  : "rgba(255, 255, 255, 0.58)",
              }}
            >
              <View
                style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(true);
                  }}
                >
                  <View
                    style={{
                      width: 110,
                      height: 130,
                      backgroundColor: "transparent",
                      borderRadius: 8,
                      overflow: "hidden",
                      borderWidth: 1.5,
                      borderColor: isDark ? "#16944a" : "#53d68a",
                    }}
                  >
                    <Image
                      style={{
                        marginTop: -15,
                        width: 110,
                        height: 160,
                        backgroundColor: "transparent",
                      }}
                      source={require("@/assets/images/photos/icon2.jpg")}
                    />
                  </View>
                </TouchableOpacity>
                <Modal
                  transparent={true}
                  visible={modalVisible}
                  animationType="fade"
                  statusBarTranslucent
                  onRequestClose={closeModal}
                >
                  <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={styles.modalBackdrop}>
                      <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={styles.modalCard}>
                          <Pressable onPress={handleModalImageTap}>
                            <Animated.Image
                              style={[
                                styles.modalImage,
                                { transform: [{ scale: modalImageScale }] },
                              ]}
                              source={require("@/assets/images/photos/icon2.jpg")}
                            />
                          </Pressable>
                          <ThemedText
                            lightColor="#ffffff"
                            darkColor="#ffffff"
                            style={styles.modalHint}
                          >
                            Double tap image to zoom
                          </ThemedText>
                          <Pressable
                            style={styles.modalCloseBtn}
                            onPress={closeModal}
                          >
                            <ThemedText style={styles.modalCloseText}>
                              Close
                            </ThemedText>
                          </Pressable>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>

                <View>
                  <ThemedText
                    lightColor="#ffffff"
                    darkColor="#ffffff"
                    style={{ fontWeight: "800" }}
                  >
                    Schorlar Info:
                  </ThemedText>
                  <ThemedText lightColor="#ffffff" darkColor="#ffffff">
                    Schorlar Name here
                  </ThemedText>
                  <ThemedText lightColor="#ffffff" darkColor="#ffffff">
                    Schorlar Email here
                  </ThemedText>
                  <ThemedText lightColor="#ffffff" darkColor="#ffffff">
                    {" "}
                  </ThemedText>
                  <ThemedText
                    lightColor="#ffffff"
                    darkColor="#ffffff"
                    style={{ fontWeight: "800" }}
                  >
                    Tafseer Session Info:
                  </ThemedText>
                  <ThemedText lightColor="#ffffff" darkColor="#ffffff">
                    <ThemedText
                      style={{ fontWeight: "600" }}
                      lightColor="#ffffff"
                      darkColor="#ffffff"
                    >
                      {" "}
                      Venue:
                    </ThemedText>{" "}
                    Address here Mosque
                  </ThemedText>
                  <ThemedText lightColor="#ffffff" darkColor="#ffffff">
                    <ThemedText
                      style={{ fontWeight: "600" }}
                      lightColor="#ffffff"
                      darkColor="#ffffff"
                    >
                      {" "}
                      Time:
                    </ThemedText>{" "}
                    4:30 PM - 8:00 PM
                  </ThemedText>
                </View>
              </View>
            </ThemedView>
          </View>

          <View style={styles.bottomArea}>
            <View style={styles.indicators}>
              {slides.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.dot,
                    index === activeSlide ? styles.dotActive : styles.dotIdle,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                router.push("/Home");
              }}
              style={styles.button}
            >
              <ThemedText style={styles.buttonText}>Proceed</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedImageBackground>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <ThemedText style={styles.tagText}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  background: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 70,
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.34)",
  },
  topChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(22, 148, 74, 0.82)",
  },
  topChipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  contentBlock: {
    gap: 12,
    marginTop: 40,
  },
  title: {
    color: "#ffffff",
    fontSize: 38,
    lineHeight: 42,
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginTop: 80,
  },
  subtitle: {
    color: "#f4fff7",
    fontSize: 17,
    lineHeight: 24,
    maxWidth: 340,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(12, 63, 31, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(125, 235, 168, 0.38)",
  },
  tagText: {
    color: "#deffeb",
    fontWeight: "600",
    fontSize: 13,
  },
  bottomArea: {
    gap: 14,
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  dotActive: {
    width: 24,
    backgroundColor: "#39d47d",
  },
  dotIdle: {
    width: 8,
    backgroundColor: "rgba(214, 255, 228, 0.56)",
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16944a",
    borderWidth: 1,
    borderColor: "#4be08a",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: 10,
  },
  modalImage: {
    width: 320,
    height: 420,
    borderRadius: 16,
  },
  modalHint: {
    fontSize: 13,
    opacity: 0.9,
  },
  modalCloseBtn: {
    marginTop: 2,
    minHeight: 38,
    minWidth: 96,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(22, 148, 74, 0.95)",
    borderWidth: 1,
    borderColor: "#63e79b",
  },
  modalCloseText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
