import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageRequireSource,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const IMAGE_ASSETS: ImageRequireSource[] = [
  require("@/assets/images/photos/bg (1).jpg"),
  require("@/assets/images/photos/bg (2).jpg"),
  require("@/assets/images/photos/bg (3).jpg"),
  require("@/assets/images/photos/bg (4).jpg"),
  require("@/assets/images/photos/bg (5).jpg"),
  require("@/assets/images/photos/bg (6).jpg"),
  require("@/assets/banner/day_1.jpg"),
  require("@/assets/banner/day_2.jpg"),
  require("@/assets/banner/day_3.jpg"),
  require("@/assets/banner/day_4.jpg"),
  require("@/assets/images/photos/icon.jpg"),
  require("@/assets/images/photos/icon2.jpg"),
  require("@/assets/images/photos/images.jpg"),
  require("@/assets/images/photos/images1.jpg"),
];

const RAMADAN_DAYS = [
  { day: 1, theme: "Laylatul Qadr Preparation" },
  { day: 2, theme: "The Night of Power" },
  { day: 3, theme: "Divine Revelation" },
  { day: 4, theme: "Spiritual Awakening" },
  { day: 5, theme: "Mercy Descends" },
  { day: 6, theme: "Guidance & Light" },
  { day: 7, theme: "Forgiveness Seekers" },
  { day: 8, theme: "Blessings Abound" },
  { day: 9, theme: "Heart Purification" },
  { day: 10, theme: "Patience & Reward" },
  { day: 11, theme: "Divine Protection" },
  { day: 12, theme: "Spiritual nourishment" },
  { day: 13, theme: "Reflection & Remembrance" },
  { day: 14, theme: "Increasing Faith" },
  { day: 15, theme: "Halfway to Victory" },
  { day: 16, theme: "Dua Acceptance" },
  { day: 17, theme: "Divine Mercy" },
  { day: 18, theme: "Soul Purification" },
  { day: 19, theme: "Spiritual Elevation" },
  { day: 20, theme: "Last Ten Days Begins" },
  { day: 21, theme: "Night of Power Seeking" },
  { day: 22, theme: "Intense Worship" },
  { day: 23, theme: "Laylatul Qadr Eve" },
  { day: 24, theme: "The Grand Night" },
  { day: 25, theme: "Celebration of Victory" },
  { day: 26, theme: "Gratitude & Praise" },
  { day: 27, theme: "Eid Preparation" },
];

type GalleryItem = {
  day: number;
  theme: string;
  images: ImageRequireSource[];
};

const generateGalleryData = (): GalleryItem[] => {
  return RAMADAN_DAYS.map((item, dayIndex) => {
    const numImages = 5 + (dayIndex % 3);
    const images = Array.from({ length: numImages }, (_, i) => {
      const index = (dayIndex * 3 + i) % IMAGE_ASSETS.length;
      return IMAGE_ASSETS[index];
    });
    return { day: item.day, theme: item.theme, images };
  });
};

function DayPage({
  item,
  onImagePress,
}: {
  item: GalleryItem;
  onImagePress: (idx: number) => void;
}) {
  const { day, theme, images } = item;
  return (
    <View style={styles.dayPage}>
      <View style={styles.dayHeader}>
        <View style={styles.dayBadge}>
          <ThemedText style={styles.dayBadgeText}>Day {day}</ThemedText>
        </View>
        <ThemedText style={styles.dayTheme}>{theme}</ThemedText>
      </View>
      <Pressable
        onPress={() => onImagePress(0)}
        style={({ pressed }) => [
          styles.featuredContainer,
          pressed && styles.imagePressed,
        ]}
      >
        <Image source={images[0]} style={styles.featuredImage} />
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredLabel}>Featured</Text>
        </View>
      </Pressable>
      <View style={styles.mediumPairContainer}>
        {images.slice(1, 3).map((img, idx) => (
          <Pressable
            key={`medium-${idx}`}
            onPress={() => onImagePress(idx + 1)}
            style={({ pressed }) => [
              styles.mediumContainer,
              pressed && styles.imagePressed,
            ]}
          >
            <Image source={img} style={styles.mediumImage} />
            <View style={styles.mediumOverlay}>
              <Text style={styles.mediumLabel}>{idx + 2}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={styles.gridContainer}>
        {images.slice(3).map((img, idx) => (
          <Pressable
            key={`grid-${idx}`}
            onPress={() => onImagePress(idx + 3)}
            style={({ pressed }) => [
              styles.gridItem,
              pressed && styles.imagePressed,
            ]}
          >
            <Image source={img} style={styles.gridImage} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function GalleryScreen() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const galleryData = useMemo(() => generateGalleryData(), []);

  const openViewer = useCallback((imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
    setIsViewerOpen(true);
  }, []);

  const closeViewer = () => setIsViewerOpen(false);

  const currentImage = galleryData[selectedDay]?.images[selectedImageIndex];

  const handleSaveImage = useCallback(async () => {
    if (!currentImage) return;

    try {
      setIsSaving(true);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to save images to your gallery.",
        );
        setIsSaving(false);
        return;
      }

      Alert.alert(
        "Info",
        "For bundled app images, they are saved automatically when you build the APK. To save individual images, you would need to use remote image URLs instead.",
      );
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", "Failed to save image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [currentImage]);

  const handleShareImage = useCallback(async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "Sharing is not available on this device.");
        return;
      }

      const shareUrl = "https://profbappagarkuwa.vercel.app";
      await Sharing.shareAsync(shareUrl);
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share. Please try again.");
    }
  }, []);

  const handleImagePress = useCallback(
    (idx: number) => openViewer(idx),
    [openViewer],
  );

  const renderDayPage = useCallback(
    ({ item }: { item: GalleryItem }) => (
      <DayPage item={item} onImagePress={handleImagePress} />
    ),
    [handleImagePress],
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setSelectedDay(viewableItems[0].index || 0);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Ramadan Gallery
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          27 Days of Blessed Moments
        </ThemedText>
      </View>
      <FlatList
        data={galleryData}
        renderItem={renderDayPage}
        keyExtractor={(item) => `day-${item.day}`}
        pagingEnabled
        horizontal
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        contentContainerStyle={styles.pagesContainer}
      />
      <View style={styles.pageIndicator}>
        {galleryData.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === selectedDay ? styles.dotActive : styles.dotIdle,
            ]}
          />
        ))}
      </View>
      <Modal
        visible={isViewerOpen}
        transparent={false}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeViewer}
      >
        <View style={styles.viewerContainer}>
          <View style={styles.viewerTopBar}>
            <Pressable onPress={closeViewer} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
            <View style={styles.viewerTitleContainer}>
              <Text style={styles.viewerTitle}>Day {selectedDay + 1}</Text>
              <Text style={styles.viewerSubtitle}>
                {galleryData[selectedDay]?.theme}
              </Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <FlatList
            data={galleryData[selectedDay]?.images || []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImageIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            keyExtractor={(img, idx) => `viewer-${selectedDay}-${idx}`}
            renderItem={({ item }) => (
              <View style={styles.viewerImageContainer}>
                <Image
                  source={item}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              </View>
            )}
            onMomentumScrollEnd={(e) =>
              setSelectedImageIndex(
                Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH),
              )
            }
          />
          <View style={styles.actionButtonsContainer}>
            <View style={styles.imageCounter}>
              <Text style={styles.counterText}>
                {selectedImageIndex + 1} /{" "}
                {galleryData[selectedDay]?.images.length || 0}
              </Text>
            </View>
            {/* <View style={styles.actionButtonsColumn}>
              <Pressable style={styles.actionButton} 
              // onPress={handleShareImage}
              >
                <View style={styles.actionIconCircle}>
                  <Text style={styles.actionIconText}>↗</Text>
                </View>
                <Text style={styles.actionLabel}>Share</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                // onPress={handleSaveImage}
                disabled={isSaving}
              >
                <View style={styles.actionIconCircle}>
                  <Text style={styles.actionIconText}>
                    {isSaving ? "..." : "↓"}
                  </Text>
                </View>
                <Text style={styles.actionLabel}>
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View> */}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(22, 148, 74, 0.15)",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#16944a" },
  headerSubtitle: { fontSize: 14, opacity: 0.7, marginTop: 2 },
  pagesContainer: { paddingHorizontal: 0 },
  dayPage: { width: SCREEN_WIDTH, paddingHorizontal: 14, paddingTop: 16 },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  dayBadge: {
    backgroundColor: "#16944a",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dayBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dayTheme: { fontSize: 18, fontWeight: "700", flex: 1 },
  featuredContainer: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 10,
  },
  featuredImage: { width: "100%", height: "100%" },
  featuredOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  featuredLabel: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",

  },
  mediumPairContainer: { flexDirection: "row", gap: 10, marginBottom: 10 },
  mediumContainer: {
    flex: 1,
    height: 130,
    borderRadius: 14,
    overflow: "hidden",
  },
  mediumImage: { width: "100%", height: "100%" },
  mediumOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediumLabel: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridItem: { width: "31%", height: 85, borderRadius: 10, overflow: "hidden" },
  gridImage: { width: "100%", height: "100%" },
  imagePressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    marginBottom: 130,
  },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 18, backgroundColor: "#16944a" },
  dotIdle: { width: 6, backgroundColor: "rgba(22, 148, 74, 0.3)" },
  viewerContainer: { flex: 1, backgroundColor: "#000000" },
  viewerTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: { paddingVertical: 8, paddingRight: 12 },
  backButtonText: { color: "#16944a", fontSize: 16, fontWeight: "600" },
  viewerTitleContainer: { alignItems: "center" },
  viewerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  viewerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  placeholder: { width: 60 },
  viewerImageContainer: {
    width: SCREEN_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00b81f15",
  },
  viewerImage: { width: SCREEN_WIDTH, height: "100%" },
  actionButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: "rgba(150, 150, 150, 0)",
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: "flex-end",
  },
  imageCounter: {
    alignItems: "center",
    marginBottom: 20,
    marginRight: 25,
    position: "absolute",
    top: -20,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  actionButtonsColumn: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
  },
  actionButton: { alignItems: "center", gap: 8 },
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
  actionIconText: { color: "#ffffff", fontSize: 24, fontWeight: "600" },
  actionLabel: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
});
