import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function AppHeader({
  title = 'Title',
  showBack = true,
  showFilter = false,
  showReload = false,
  showDownload = false, // 👈 NEW
  onFilterPress,
  onReloadPress,
  onDownloadPress, // 👈 NEW
  downloading = false, // 👈 NEW (optional: show progress icon / disable)
  bgColor = 'bg-white',
  textColor = 'text-black',
  iconColor = '#EC1D3D',
  className = '',
  borderBottom = true,
}) {
  const navigation = useNavigation();

  return (
    <View
      className={`h-14 flex-row items-center justify-between px-5 ${bgColor} ${
        borderBottom ? 'border-b border-gray-200' : ''
      } ${className}`}
      style={{
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        zIndex: 10,
      }}>
      {/* Left Section */}
      <View className="flex-row items-center gap-3">
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <Text className={`text-xl font-bold ${textColor}`}>{title}</Text>
      </View>

      {/* Right Buttons */}
      <View className="flex-row items-center gap-2">
        {showFilter && (
          <TouchableOpacity onPress={onFilterPress} className="rounded bg-black/10 p-1.5">
            <MaterialCommunityIcons name="filter-variant" size={20} color={iconColor} />
          </TouchableOpacity>
        )}
        {showReload && (
          <TouchableOpacity onPress={onReloadPress} className="rounded bg-black/10 p-1.5">
            <Ionicons name="reload" size={20} color={iconColor} />
          </TouchableOpacity>
        )}
        {showDownload && (
          <TouchableOpacity
            onPress={onDownloadPress}
            disabled={downloading}
            className={`rounded bg-black/10 p-1.5 ${downloading ? 'opacity-50' : ''}`}>
            <MaterialCommunityIcons
              name={downloading ? 'progress-download' : 'download'}
              size={20}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
