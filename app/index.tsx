import { useEffect, useRef, useState, useCallback } from 'react';
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
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ROLE_HOME } from '../lib/backend';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

type Slide = {
  id: string;
  role: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  gradient: [string, string, string];
};

const SLIDES: Slide[] = [
  {
    id: '1',
    role: 'BuildLinka',
    icon: 'construction',
    title: 'One App.\nEvery Builder.',
    subtitle: 'Buy, sell, hire, engineer.',
    description:
      'BuildLinka puts Nigeria\u2019s construction market in your pocket. Pick the account type that fits you — one login holds every type, and you can switch any time.',
    features: [
      'One phone number, every account type',
      'Switch Buyer, Vendor, Worker, Engineer instantly',
      'Verified stores and secure checkout',
    ],
    gradient: [Colors.primary, Colors.primaryContainer, Colors.primary] as [string, string, string],
  },
  {
    id: '2',
    role: 'Buyer',
    icon: 'shopping-bag',
    title: 'Buyer.\nSource Smarter.',
    subtitle: 'Materials direct to site.',
    description:
      'Browse live catalogues from verified vendors, check out in minutes, and track every order to your site.',
    features: [
      'Live prices in naira, per bag, sheet, or piece',
      'Cart, checkout & order tracking',
      'Saved items and barcode scanner',
      'Standard, express, or pickup delivery',
    ],
    gradient: ['#0d631b', '#1b7a2a', '#0d631b'] as [string, string, string],
  },
  {
    id: '3',
    role: 'Vendor',
    icon: 'store',
    title: 'Vendor.\nSell Nationwide.',
    subtitle: 'Your store, open 24/7.',
    description:
      'Open your storefront in minutes, list products with photos, and manage orders, stock, and sales from one dashboard.',
    features: [
      'Store setup with area, city & GPS',
      'Listings with photos, drafts & barcodes',
      'Inventory with low-stock alerts',
      'Orders pipeline: confirm → ship → deliver',
      'Sales analytics by month',
    ],
    gradient: [Colors.secondary, Colors.secondaryContainer, Colors.secondary] as [string, string, string],
  },
  {
    id: '4',
    role: 'Worker',
    icon: 'build',
    title: 'Worker.\nGet Hired.',
    subtitle: 'Your skill, your rates.',
    description:
      'Create your worker profile with trade, experience, and daily rate. Clients find you by trade and location.',
    features: [
      'Profile with trade, skills & experience',
      'Available / busy badge',
      'Daily rate in naira',
      'Hire requests land in your dashboard',
    ],
    gradient: ['#6d5100', '#8a6a00', '#6d5100'] as [string, string, string],
  },
  {
    id: '5',
    role: 'Engineer',
    icon: 'engineering',
    title: 'Engineer.\nRun Projects.',
    subtitle: 'Teams, specs, estimates.',
    description:
      'Plan builds with material calculators, keep specifications at hand, and coordinate your team and milestones.',
    features: [
      'Cement, rebar & roofing estimators',
      'Project specs and milestones',
      'Team coordination',
      'Buyer + vendor access included',
    ],
    gradient: [Colors.tertiary, Colors.primaryContainer, Colors.tertiary] as [string, string, string],
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
        <View style={styles.rolePill}>
          <MaterialIcons name={item.icon as never} size={14} color={Colors.primary} />
          <Text style={styles.rolePillText}>{item.role}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.featureList}>
          {item.features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <MaterialIcons name="check-circle" size={16} color={Colors.amber} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me);

  // Signed-in users skip the intro and land on their own dashboard.
  useEffect(() => {
    if (authLoading || !isAuthenticated || me === undefined) return;
    if (me?.activeRole) router.replace(ROLE_HOME[me.activeRole] as any);
    else router.replace('/persona-onboarding' as any);
  }, [authLoading, isAuthenticated, me]);

  const next = () => router.replace((isAuthenticated ? '/persona-onboarding' : '/sign-in') as any);
  const handleSkip = useCallback(next, [isAuthenticated]);
  const handleGetStarted = useCallback(next, [isAuthenticated]);

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

        <View style={[styles.bottomArea, { bottom: 40 + insets.bottom }]}>
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
    gap: 12,
    width: '100%',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 2,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featureList: {
    marginTop: 8,
    gap: 8,
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 16,
    padding: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 18,
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
