import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import type { Vendor } from '../constants/MockData';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

const BANNER_DATA = [
  {
    id: '1',
    title: 'Buy Cement in Bulk',
    subtitle: 'Save up to 20% on Dangote & Elephant cement orders over 100 bags',
    cta: 'Shop Now',
    gradient: [Colors.primary, Colors.primaryContainer] as [string, string],
    emoji: '🏗️',
    tag: 'Limited Offer',
  },
  {
    id: '2',
    title: 'Hire Verified Workers',
    subtitle: 'Skilled masons, electricians & plumbers ready to start your project',
    cta: 'Find Workers',
    gradient: [Colors.secondary, Colors.secondaryContainer] as [string, string],
    emoji: '👷',
    tag: 'New Feature',
  },
  {
    id: '3',
    title: 'Steel & Roofing Sale',
    subtitle: 'Iron rods, aluminum & zinc roofing sheets at factory prices across Nigeria',
    cta: 'View Deals',
    gradient: [Colors.tertiary, Colors.tertiaryContainer] as [string, string],
    emoji: '🏠',
    tag: 'Hot Deal',
  },
];

export default function FeaturedBanner() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const currentIndex = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % BANNER_DATA.length;
      scrollRef.current?.scrollTo({
        x: currentIndex.current * (CARD_WIDTH + 16),
        animated: true,
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={{ paddingRight: 24 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {BANNER_DATA.map((item) => (
          <TouchableOpacity key={item.id} activeOpacity={0.92} style={styles.cardWrapper}>
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Tag */}
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>
                <TouchableOpacity style={styles.ctaBtn}>
                  <Text style={styles.ctaText}>{item.cta}</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={item.gradient[0]} />
                </TouchableOpacity>
              </View>

              {/* Emoji decoration */}
              <Text style={styles.decoration}>{item.emoji}</Text>

              {/* Decorative circles */}
              <View style={[styles.circle, styles.circleSmall]} />
              <View style={[styles.circle, styles.circleLarge]} />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {BANNER_DATA.map((_, i) => {
          const inputRange = [
            (i - 1) * (CARD_WIDTH + 16),
            i * (CARD_WIDTH + 16),
            (i + 1) * (CARD_WIDTH + 16),
          ];
          const width = scrollX.interpolate({
            inputRange,
            outputRange: [6, 20, 6],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View key={i} style={[styles.dot, { width, opacity }]} />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    height: 160,
    padding: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  tag: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { gap: 5 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 26 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
    marginTop: 10,
  },
  ctaText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  decoration: {
    position: 'absolute',
    right: 16,
    bottom: 12,
    fontSize: 64,
    opacity: 0.35,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circleSmall: { width: 80, height: 80, top: -20, left: -20 },
  circleLarge: { width: 140, height: 140, top: 30, left: -60 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
