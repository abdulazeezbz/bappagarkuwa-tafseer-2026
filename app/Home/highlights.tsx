import { VideoItem } from '@/components/video-item';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const VIDEOS = [
  {
    id: '1',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772710178/Allah_Yana_Sama_Da_Kowa_cghatw.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Allah Yana Sama Da Kowa',
  },
  {
    id: '2',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772710266/Allah_Ya_Kare_Mana_Mutunci_Malaman_Mu_mqqkzm.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Allah Ya Kare Mana Mutunci Malaman Mu',
  },
  {
    id: '3',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772710384/Duk_Zalincin_Fir_auna_Ya_Zama_Tarihi_jp6gch.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Duk Zalincin Fir auna Ya Zama Tarihi',
  },
  {
    id: '4',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772710348/Allah_yana_sama_da_kowwa_iocrxa.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Allah yasa mu cika da imani Ameen',
  },
  {
    id: '5',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772711024/Alaramma_Ali_Sa_id_Gombe_emwtje.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Alaramma Ali Sa id Gombe',
  },
  {
    id: '6',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772710184/Ta_aziyyar_rasuwar_Alaramma_Usamah_Ahmad_Musa_wanda_ya_rasu_a_Jami_ar_Islamiyya_a_Birnin_Madina_Allah_Ya_masa_rahama_da_sauran_magabatanmu_fcv0xf.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Ta ziyyar rasuwar Alaramma Usamah Ahmad Musa wanda ya rasu a Jami\'ar Islamiyya a Birnin Madina Allah Ya masa rahama da sauran magabatanmu',
  },


];

export default function HighlightsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={VIDEOS}
        renderItem={({ item, index }) => (
          <VideoItem
            videoUrl={item.url}
            username={item.username}
            title={item.title}
            isPaused={!isFocused || index !== activeIndex}
          />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
      />

      {/* Back Button */}
      <Pressable
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
