import { Tabs } from 'expo-router';
import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#ffffff',
        headerShown: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: '#60c36a',
          borderTopWidth: 0,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarItemStyle: {
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabelPosition: 'below-icon',
          tabBarIcon: ({ color }) => <FontAwesome name="question-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'สแกน',
          tabBarLabelPosition: 'below-icon',
          tabBarIcon: ({ color }) => <MaterialIcons name="qr-code-scanner" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="questionList"
        options={{
          title: 'ตอบคำถาม',
          tabBarLabelPosition: 'below-icon',
          tabBarIcon: ({ color }) => <FontAwesome name="question-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          tabBarLabelPosition: 'below-icon',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={24} color={color} />,
        }}
      />

      {/* 🔥 ซ่อนหน้าที่ไม่ต้องการในแท็บ */}
      <Tabs.Screen name="[cid]/attendance" options={{ href: null }} />
      <Tabs.Screen name="[cno]/checkin" options={{ href: null }} />
      <Tabs.Screen name="[qid]/question" options={{ href: null }} />
    </Tabs>
  );
}