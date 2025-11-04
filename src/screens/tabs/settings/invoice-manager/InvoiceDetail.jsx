// src/screens/tabs/settings/invoice/InvoiceDetailScreen.jsx
import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppHeader from './../../../../components/AppHeader';
import { getInvoiceDownloadUrl, getInvoiceDetailsPageUrl } from './../../../../utils/apiService';

const ANDROID_DIR_KEY = 'invoice_download_dir_uri';

export default function InvoiceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params ?? {};
  const invoiceObj = params.invoice ?? params.item ?? params; // support multiple shapes

  // Resolve invoice number from object or URLs (details/123 or invoice_id=123)
  const invoiceNo = useMemo(() => {
    const fromObj = invoiceObj?.InvoiceNo ?? invoiceObj?.invoice ?? '';
    if (fromObj) return String(fromObj);

    const fromUrl =
      typeof invoiceObj?.url === 'string' ? invoiceObj.url.match(/details\/(\d+)/)?.[1] : '';
    if (fromUrl) return String(fromUrl);

    const fromDownload =
      typeof invoiceObj?.downloadUrl === 'string'
        ? invoiceObj.downloadUrl.match(/invoice_id=([^&]+)/)?.[1]
        : '';
    return fromDownload ? String(fromDownload) : '';
  }, [invoiceObj]);

  const weekNo = useMemo(
    () => invoiceObj?.week_no ?? invoiceObj?.week ?? invoiceObj?.weekNo ?? '',
    [invoiceObj]
  );

  // Prefer explicit URLs passed in params; otherwise build from invoiceNo
  const detailsUrl = useMemo(() => {
    if (typeof invoiceObj?.url === 'string' && invoiceObj.url.length > 0) {
      return invoiceObj.url;
    }
    return invoiceNo ? getInvoiceDetailsPageUrl(invoiceNo) : '';
  }, [invoiceObj, invoiceNo]);

  const downloadUrl = useMemo(() => {
    if (typeof invoiceObj?.downloadUrl === 'string' && invoiceObj.downloadUrl.length > 0) {
      return invoiceObj.downloadUrl;
    }
    return invoiceNo ? getInvoiceDownloadUrl(invoiceNo) : '';
  }, [invoiceObj, invoiceNo]);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Direct PDF download:
  // - Android: use Storage Access Framework (SAF) to write into user-chosen folder
  // - iOS: save to app cache then open Share/Save sheet
  const downloadAsPDF = useCallback(async () => {
    if (!downloadUrl) return;

    const filename = `Invoice-${invoiceNo || weekNo || Date.now()}.pdf`;
    const tempPath = FileSystem.cacheDirectory + filename;

    try {
      setDownloading(true);

      // 1) download PDF bytes into a temp file
      const res = await FileSystem.downloadAsync(downloadUrl, tempPath);
      if (res.status !== 200) throw new Error(`Download failed with status ${res.status}`);

      // 2) ANDROID: persist to a folder chosen by the user via SAF
      if (FileSystem.StorageAccessFramework) {
        try {
          // reuse previously granted directory if available
          let dirUri = await AsyncStorage.getItem(ANDROID_DIR_KEY);

          if (!dirUri) {
            const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!perm.granted) {
              // fallback: Share sheet (user can save to Files/Drive)
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(res.uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: filename,
                });
              } else {
                Alert.alert('Downloaded', `Saved to: ${res.uri}`);
              }
              return;
            }
            dirUri = perm.directoryUri;
            await AsyncStorage.setItem(ANDROID_DIR_KEY, dirUri);
          }

          const contentUri = await FileSystem.StorageAccessFramework.createFileAsync(
            dirUri,
            filename,
            'application/pdf'
          );

          const base64 = await FileSystem.readAsStringAsync(res.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await FileSystem.writeAsStringAsync(contentUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          Alert.alert('Downloaded', `Saved as ${filename}`);
          return;
        } catch (androidErr) {
          // If SAF fails (permission lost, etc.), fall back to Share sheet
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(res.uri, {
              mimeType: 'application/pdf',
              dialogTitle: filename,
            });
          } else {
            Alert.alert('Downloaded', `Saved to: ${res.uri}`);
          }
          return;
        }
      }

      // 3) iOS or environments without SAF -> Share sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri, { mimeType: 'application/pdf', dialogTitle: filename });
      } else {
        Alert.alert('Downloaded', `Saved to: ${res.uri}`);
      }
    } catch (e) {
      // Final fallback: open in browser (many servers auto-download)
      try {
        await WebBrowser.openBrowserAsync(downloadUrl);
      } catch {}
      console.warn('Download error:', e?.message);
      Alert.alert('Download failed', e?.message ?? 'Unknown error');
    } finally {
      setDownloading(false);
      // Optional cleanup:
      // try { await FileSystem.deleteAsync(tempPath, { idempotent: true }); } catch {}
    }
  }, [downloadUrl, invoiceNo, weekNo]);

  // Header with Download action (uses your AppHeader)
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title={`Invoice #${invoiceNo || '-'}`}
          showBack
          bgColor="bg-white"
          textColor="text-text"
          showDownload={!!downloadUrl}
          onDownloadPress={downloadAsPDF}
          downloading={downloading}
        />
      ),
    });
  }, [navigation, invoiceNo, downloadUrl, downloadAsPDF, downloading]);

  return (
    <View className="flex-1 bg-background">
      {detailsUrl ? (
        <>
          <WebView
            style={{ flex: 1 }}
            source={{ uri: detailsUrl }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
          {loading && (
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}>
              <ActivityIndicator size="large" />
            </View>
          )}
        </>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Invalid or missing invoice data.</Text>
        </View>
      )}
    </View>
  );
}
