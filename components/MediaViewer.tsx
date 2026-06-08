import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const { width: W, height: H } = Dimensions.get('window');

type Props = {
  uri: string;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: 'low' | 'normal' | 'high';
  allowPreview?: boolean;
};

export function MediaViewer({ uri, style, contentFit = 'cover', priority = 'normal', allowPreview = true }: Props) {
  const [previewVisible, setPreviewVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        activeOpacity={allowPreview ? 0.85 : 1}
        onPress={() => allowPreview && setPreviewVisible(true)}
        disabled={!allowPreview}
      >
        <Image
          source={uri}
          style={style}
          contentFit={contentFit}
          priority={priority}
          transition={300}
          cachePolicy="memory-disk"
          placeholder={null}
        />
      </TouchableOpacity>

      <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewVisible(false)}>
            <MaterialIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Image source={uri} style={styles.previewImage} contentFit="contain" priority="high" />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: W,
    height: H * 0.7,
  },
});
