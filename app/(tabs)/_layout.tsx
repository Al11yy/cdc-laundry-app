import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    tabBarBg: isDark ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    inactiveTint: isDark ? '#737373' : '#a3a3a3',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196D3', // Brand Blue
        tabBarInactiveTintColor: themeColors.inactiveTint,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: themeColors.tabBarBg,
            borderColor: themeColors.borderColor,
          }
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cucian Saya',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="washing-machine" color={color} size={focused ? size + 2 : size} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="history" color={color} size={focused ? size + 2 : size} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="account" color={color} size={focused ? size + 2 : size} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontFamily: 'Poppins_600Medium',
    fontSize: 10,
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7EC839', // Brand Green
    marginTop: 4,
  },
});