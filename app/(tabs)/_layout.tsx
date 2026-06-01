import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function TabsLayout() {
  const themeColors = {
    tabBarBg: '#ffffff',       // Latar belakang tab bar putih bersih
    inactiveTint: '#94a3b8',   // Slate gray saat tidak aktif
    activeTint: '#2196D3',     // Brand blue saat aktif
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.activeTint,
        tabBarInactiveTintColor: themeColors.inactiveTint,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: themeColors.tabBarBg,
            borderColor: 'transparent',
          }
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cucian Saya',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons 
                name="washing-machine" 
                color={color} 
                size={22} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons 
                name="history" 
                color={color} 
                size={22} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons 
                name={focused ? "account" : "account-outline"} 
                color={color} 
                size={22} 
              />
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
    marginHorizontal: 16,
    bottom: 24,
    height: 66,
    borderRadius: 28,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 6,
  },
  tabBarLabel: {
    fontFamily: 'Poppins_600Medium',
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
});