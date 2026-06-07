import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1E90FF',
        tabBarInactiveTintColor: 'white',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            backgroundColor: '#262626',
          },
          default: {
            backgroundColor: '#262626',
            height: 55
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Index',
          tabBarStyle: { display: 'none' },
          href: null,
          tabBarIcon: ({ color }) => <Entypo size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={30} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendarView"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="healthReports"
        options={{
          title: 'Daily Reports',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="flag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favouritesList"
        options={{
          title: 'Favourites',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={26} name="star" color={color} />,
        }}
      />
      <Tabs.Screen
        name="activityPage"
        options={{
          title: 'Activity',
          href: null,
        }}
      />
      <Tabs.Screen
        name="userRegistration"
        options={{
          title: 'User Registration',
          tabBarStyle: { display: 'none' },
          href: null,
        }}
      />
      <Tabs.Screen
        name="passwordRecovery"
        options={{
          title: 'Password Recovery',
          tabBarStyle: { display: 'none' },
          href: null,
        }}
      />
      <Tabs.Screen
        name="userProfile"
        options={{
          title: 'User',
          href: null,
        }}
      />
      <Tabs.Screen
        name="helpPage"
        options={{
          title: 'Help',
          href: null,
        }}
      />
    </Tabs>
  );
}
