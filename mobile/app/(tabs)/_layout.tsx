import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';
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
          flexDirection: 'column', // จัดเรียงเป็นแนวตั้ง
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelPosition: 'below-icon', // บังคับให้ตัวหนังสืออยู่ข้างล่างไอคอนเสมอ
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabelPosition: 'below-icon',
          tabBarIcon: ({ color }) => <FontAwesome name="question-circle" size={24} color={color} />, // ไอคอนตอบคำถาม
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'สแกน',
          tabBarLabelPosition: 'below-icon',
          tabBarIcon: ({ color }) => <MaterialIcons name="qr-code-scanner" size={24} color={color} />, // ไอคอนสแกน
        }}
      />
      <Tabs.Screen
        name="questionList"
        options={{
          title: 'ตอบคำถาม',
          tabBarLabelPosition: 'below-icon',
          tabBarIcon: ({ color }) => <FontAwesome name="question-circle" size={24} color={color} />, // ไอคอนตอบคำถาม
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          tabBarLabelPosition: 'below-icon',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={24} color={color} />, // ไอคอนโปรไฟล์
        }}
      />
    </Tabs>
  );
}