import { VideoItem } from '@/components/video-item';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
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
  {
    id: '7',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799627/Allah_yasa_mu_Dace_Duniya_Da_Lahira_iv3oh8.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Allah yasa mu Dace Duniya Da Lahira',
  },
  {
    id: '8',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799555/Qur_ani_Ya_Kunshi_Komai_wtntw7.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Qur ani Ya Kunshi Komai',
  },
  {
    id: '9',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799499/Allah_mai_halittu_kala_kala_jwbzx2.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Allah mai halittu kala kala',
  },
  {
    id: '10',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799454/Mu_yawaita_Ayyukan_Alkhairi_apcqez.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Mu yawaita Ayyukan Alkhairi',
  },
  {
    id: '11',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799419/RAMADN_TAFSEER_KAGARAWAL_ib1v0b.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'RAMADN TAFSEER KAGARAWAL',
  },
  {
    id: '12',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799290/Ramadan_Tafseer_Moments_at_Kagarawal_Kofar_Dagaci_Jum_at_Mosque_nl4cfa.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Ramadan Tafseer Moments at Kagarawal Kofar Dagaci Jum at Mosque',
  },
  {
    id: '13',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799281/ISRAILIYYAT_qwxzb8.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'ISRAILIYYAT',
  },
  {
    id: '14',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799295/Ameen_Ya_ALLAH_etyaqs.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Ameen Ya ALLAH',
  },
  {
    id: '15',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799307/RAMADAN_MOMENT_rkvbew.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'RAMADAN MOMENT',
  },
  {
    id: '16',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799319/Allah_ya_kyauta_cqokfm.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Allah ya kyauta',
  },
  {
    id: '17',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799322/Mu_koma_ga_Allah_cdtivs.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Mu koma ga Allah',
  },
  {
    id: '18',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799347/2026_RAMADAN_MOMENTS_irqyuw.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: '2026 RAMADAN MOMENTS',
  },
  {
    id: '19',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799380/Allah_Ya_Inganta_Mana_Rayuwarmu_pl6lov.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Allah Ya Inganta Mana Rayuwarmu',
  },
  {
    id: '20',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799388/Duniya_Labari_Allah_yasa_Muyi_Kyakkyawan_Karshe_epfxse.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Duniya Labari Allah yasa Muyi Kyakkyawan Karshe',
  },
  {
    id: '21',
    url: 'https://res.cloudinary.com/dpjni6fdl/video/upload/v1772799388/Duniya_Labari_Allah_yasa_Muyi_Kyakkyawan_Karshe_epfxse.mp4',
    username: 'Prof Abdullahi Bappa Garkuwa',
    title: 'Duniya Labari Allah yasa Muyi Kyakkyawan Karshe',
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

  // On web, the browser back button fires 'popstate' — stop all videos
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handlePop = () => setIsFocused(false);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // On web, FlatList's onViewableItemsChanged is unreliable.
  // Use scroll offset to calculate the active index instead.
  const onWebScroll = useCallback((event: any) => {
    if (Platform.OS !== 'web') return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / height);
    setActiveIndex(index);
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (Platform.OS === 'web') return; // handled by onWebScroll
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
        onScroll={onWebScroll}
        scrollEventThrottle={16}
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
