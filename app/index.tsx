import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

type Slide = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: [string, string, string];
};

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🏗️',
    title: 'Premium Materials,\nDirect to You',
    subtitle: 'Source smarter. Build stronger.',
    description:
      'Browse thousands of construction materials from verified vendors across Nigeria. Quality guaranteed, prices you can trust.',
    gradient: [Colors.primary, Colors.primaryContainer, Colors.primary] as [string, string, string],
  },
  {
    id: '2',
    emoji: '👷',
    title: 'Skilled Workers,\nOne Tap Away',
    subtitle: 'Hire with confidence.',
    description:
      'Connect with vetted masons, electricians, plumbers, and carpenters. View reviews, compare rates, and start your project.',
    gradient: [Colors.secondary, Colors.secondaryContainer, Colors.secondary] as [string, string, string],
  },
  {
    id: '3',
    emoji: '🤝',
    title: 'Build Nigeria.\nTogether.',
    subtitle: 'Join 10,000+ builders nationwide.',
    description:
      'One app for materials, workers, equipment — everything you need to bring your vision to life.',
    gradient: [Colors.primary, Colors.primaryContainer, Colors.tertiary] as [string, string, string],
  },
];

function SlideItem({ item, index, scrollX }: { item: Slide; index: number; scrollX: Animated.Value }) {
  const inputRange = [
    (index - 1) * width,
    index * width,
    (index + 1) * width,
  ];

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.85, 1, 0.85],
    extrapolate: 'clamp',
  });

  return (
    <LinearGradient
      colors={item.gradient}
      style={styles.slide}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Animated.View style={[styles.slideContent, { opacity, transform: [{ scale }] }]}>
        <View style={styles.emojiContainer}>
          <View style={[styles.emojiRingInner, { borderColor: Colors.amber + '50' }]} />
          <View style={[styles.emojiRingOuter, { borderColor: Colors.amber + '25' }]} />
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const pageRef = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      pageRef.current = next;
      setPage(next);
    },
    []
  );

  const handleNext = useCallback(() => {
    const next = pageRef.current + 1;
    if (next < SLIDES.length) {
      pageRef.current = next;
      setPage(next);
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    }
  }, []);

  const handleSkip = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const handleGetStarted = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const isLastSlide = page === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {!isLastSlide && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
        style={styles.list}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={styles.bottomArea}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * width,
              i * width,
              (i + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            const dotColor = scrollX.interpolate({
              inputRange,
              outputRange: [
                'rgba(255,255,255,0.35)',
                Colors.amber,
                'rgba(255,255,255,0.35)',
              ],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity: dotOpacity, backgroundColor: dotColor },
                ]}
              />
            );
          })}
        </View>

        {isLastSlide ? (
          <TouchableOpacity
            style={styles.getStartedBtn}
            activeOpacity={0.85}
            onPress={handleGetStarted}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextBtn}
            activeOpacity={0.85}
            onPress={handleNext}
          >
            <Text style={styles.nextText}>Next</Text>
            <MaterialIcons name="arrow-forward" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    gap: 14,
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  emoji: {
    fontSize: 76,
    zIndex: 2,
  },
  emojiRingInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
  },
  emojiRingOuter: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.textWhite,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.amberLight,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginTop: 4,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 24,
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingVertical: 17,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 99,
    paddingVertical: 17,
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  nextText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
});
