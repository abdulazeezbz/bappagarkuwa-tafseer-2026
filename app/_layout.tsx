import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import Toast from "react-native-toast-message";

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    primary: Colors.light.tint,
    border: Colors.light.border,
    notification: Colors.light.tint,
  },
};

const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    primary: Colors.dark.tint,
    border: Colors.dark.border,
    notification: Colors.dark.tint,
  },
};

// PRELOAD ASSETS
const PRELOAD_IMAGES = [
  require('@/assets/images/photos/bg (1).jpg'),
  require('@/assets/images/photos/bg (2).jpg'),
  require('@/assets/images/photos/bg (3).jpg'),
  require('@/assets/images/photos/bg (4).jpg'),
  require('@/assets/images/photos/bg (5).jpg'),
  require('@/assets/images/photos/bg (6).jpg'),
  require('@/assets/banner/day_1.jpg'),
  require('@/assets/banner/day_2.jpg'),
  require('@/assets/banner/day_3.jpg'),
  require('@/assets/banner/day_4.jpg'),
  require('@/assets/images/photos/icon.jpg'),
  require('@/assets/images/photos/icon2.jpg'),
  require('@/assets/images/photos/images.jpg'),
  require('@/assets/images/photos/images1.jpg'),
];

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Preload images
        const imageAssets = PRELOAD_IMAGES.map(image => Asset.fromModule(image).downloadAsync());
        await Promise.all(imageAssets);

        // Welcome Notification
        if (Platform.OS !== 'web') {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Maraba da bappagarkuwa!",
                body: "Go to Highlight Section to Watch Short Videos",
                data: { screen: 'Highlights' },
              },
              trigger: null, // Send immediately
            });
          }
        }
      } catch (e) {
        console.warn('Error during app prep:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <ThemeProvider value={isDark ? darkTheme : lightTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: isDark ? Colors.dark.surface : Colors.light.surface },
          headerTintColor: isDark ? Colors.dark.text : Colors.light.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: {
            backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
          },
        }}>
        <Stack.Screen name="index" options={{ title: 'Bappagarkuwa' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Toast />
    </ThemeProvider>
  );
}
