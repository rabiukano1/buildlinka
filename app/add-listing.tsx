import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Image, ActionSheetIOS, Platform, Modal, Animated } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const MAX_IMAGES = 6;
const MAX_DESC_LENGTH = 500;

const CATEGORIES = ['Cement', 'Steel & Iron', 'Roofing', 'Electrical', 'Plumbing', 'Tiles', 'Timber', 'Glass', 'Paint', 'Blocks', 'Equipment'];

const UNITS = ['piece', 'bag', 'box', 'sheet', 'bucket', 'block', 'meter', 'litre', 'kg', 'pack'];

const STEPS = [
  { key: 'photos', icon: 'camera-outline', label: 'Photos' },
  { key: 'details', icon: 'list-outline', label: 'Details' },
  { key: 'pricing', icon: 'cash-outline', label: 'Price' },
  { key: 'review', icon: 'checkmark-circle-outline', label: 'Finish' },
];

function DropdownSelect({ label, value, options, onSelect, placeholder, isOpen, onToggle, onClose, error }: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  error?: string;
}) {
  const wrapperRef = useRef<View>(null);
  const [dropdownTop, setDropdownTop] = useState(0);

  const handleToggle = () => {
    wrapperRef.current?.measureInWindow((x, y, w, h) => {
      setDropdownTop(y + h + 4);
      onToggle();
    });
  };

  return (
    <View ref={wrapperRef} style={styles.dropdownWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity 
        style={[styles.dropdown, error && styles.inputError, isOpen && styles.dropdownActive]} 
        onPress={handleToggle} 
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>{value || placeholder}</Text>
        <MaterialIcons name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={22} color={Colors.textMedium} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
          <View style={[styles.modalDropdownList, { top: dropdownTop }]}>
            <ScrollView style={styles.modalDropdownScroll} showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dropdownOption, value === opt && styles.dropdownOptionActive]}
                  onPress={() => { onSelect(opt); onClose(); }}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.dropdownOptionText, value === opt && styles.dropdownOptionTextActive]}>{opt}</Text>
                  {value === opt && <MaterialIcons name="check" size={18} color={Colors.primaryGreen} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressSteps}>
        {STEPS.map((step, idx) => {
          const isDone = idx < current;
          const isActive = idx === current;
          return (
            <View key={step.key} style={styles.progressStep}>
              <View style={[
                styles.progressIconWrap,
                isDone && styles.progressIconDone,
                isActive && styles.progressIconActive
              ]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Ionicons 
                    name={step.icon as any} 
                    size={14} 
                    color={isActive ? Colors.primaryGreen : Colors.textLight} 
                  />
                )}
              </View>
              <Text style={[
                styles.progressLabel,
                isActive && styles.progressLabelActive,
                isDone && styles.progressLabelDone
              ]}>
                {step.label}
              </Text>
              {idx < total - 1 && (
                <View style={[
                  styles.progressConnector,
                  isDone && styles.progressConnectorDone
                ]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AddListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!category) e.category = 'Select a category';
    if (!price || isNaN(Number(price.replace(/,/g, ''))) || Number(price.replace(/,/g, '')) <= 0) e.price = 'Enter a valid price';
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) e.quantity = 'Enter a valid quantity';
    if (!unit) e.unit = 'Select a unit';
    return e;
  }, [title, category, price, quantity, unit]);

  const canAdvance = useMemo(() => {
    if (step === 0) return images.length > 0;
    if (step === 1) return !!title.trim() && !!category;
    if (step === 2) return !!price && !!quantity && !!unit;
    return true;
  }, [step, images.length, title, category, price, quantity, unit]);

  const totalValue = useMemo(() => {
    const p = parseFloat(price.replace(/[^0-9.]/g, ''));
    const q = parseFloat(quantity);
    if (!isNaN(p) && !isNaN(q)) return p * q;
    return 0;
  }, [price, quantity]);

  const estSales = useMemo(() => {
    if (!totalValue) return 0;
    return totalValue * 0.9;
  }, [totalValue]);

  const formatPrice = (val: string) => {
    const num = val.replace(/[^0-9.]/g, '');
    if (!num || isNaN(Number(num))) return val;
    return Number(num).toLocaleString('en-NG');
  };

  const handlePriceChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setPrice(cleaned);
  };

  const handleQuantityChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setQuantity(cleaned);
  };

  const animateToStep = (nextStepIdx: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: nextStepIdx > step ? -20 : 20, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setStep(nextStepIdx);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      slideAnim.setValue(nextStepIdx > step ? 20 : -20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    });
  };

  const nextStep = () => {
    if (!canAdvance) {
      setTouched((prev) => ({ ...prev, title: true, category: true, price: true, quantity: true, unit: true }));
      if (step === 0 && images.length === 0) {
        Alert.alert('Photos Required', 'Please add at least one photo of your product.');
      }
      return;
    }
    animateToStep(Math.min(step + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    animateToStep(Math.max(step - 1, 0));
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    };

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync({ ...options, allowsMultipleSelection: true, selectionLimit: MAX_IMAGES - images.length });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
    }
  };

  const showImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Gallery'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) pickImage('camera');
          if (idx === 2) pickImage('gallery');
        }
      );
    } else {
      Alert.alert('Add Photo', 'Select a source for your product photo', [
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Gallery', onPress: () => pickImage('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const moveImage = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[idx], next[target]] = [next[target], next[idx]];
    setImages(next);
  };

  const handleSubmit = () => {
    Alert.alert(
      'Listing Submitted 🎉',
      'Your listing has been created and is pending review. You\'ll be notified once it\'s approved.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const renderPhotosStep = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      <View style={styles.stepHero}>
        <View style={styles.heroIconCircle}>
          <Ionicons name="camera" size={32} color={Colors.primaryGreen} />
        </View>
        <Text style={styles.stepHeroTitle}>Add Product Photos</Text>
        <Text style={styles.stepHeroSub}>Listings with clear photos sell 3x faster</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.photoGrid}>
          {images.map((uri, idx) => (
            <View key={idx} style={styles.photoCell}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(idx)} hitSlop={10}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoArrow} onPress={() => moveImage(idx, -1)} disabled={idx === 0}>
                  <Ionicons name="chevron-back" size={14} color={idx === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
                </TouchableOpacity>
                <View style={styles.photoBadge}>
                  <Text style={styles.photoIndex}>{idx === 0 ? 'Cover' : idx + 1}</Text>
                </View>
                <TouchableOpacity style={styles.photoArrow} onPress={() => moveImage(idx, 1)} disabled={idx === images.length - 1}>
                  <Ionicons name="chevron-forward" size={14} color={idx === images.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity style={styles.addPhotoCell} onPress={showImagePicker} activeOpacity={0.7}>
              <Ionicons name="add-circle" size={32} color={Colors.primaryGreen} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
              <Text style={styles.addPhotoCount}>{images.length}/{MAX_IMAGES}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.photoTip}>
          <Ionicons name="information-circle" size={18} color={Colors.primary} />
          <Text style={styles.photoTipText}>First photo is your cover. Drag arrows to reorder.</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderDetailsStep = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      <View style={styles.stepHero}>
        <View style={styles.heroIconCircle}>
          <Ionicons name="list" size={32} color={Colors.primaryGreen} />
        </View>
        <Text style={styles.stepHeroTitle}>Product Details</Text>
        <Text style={styles.stepHeroSub}>Provide accurate details for better search results</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.fieldBody}>
          <Text style={styles.fieldLabel}>Listing Title *</Text>
          <TextInput
            style={[styles.input, touched.title && errors.title && styles.inputError]}
            placeholder="e.g. Dangote Cement 42.5R - 50kg"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            onBlur={() => setTouched((p) => ({ ...p, title: true }))}
          />
          {touched.title && errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        <View style={styles.spacer} />

        <DropdownSelect
          label="Category *"
          value={category}
          options={CATEGORIES}
          onSelect={setCategory}
          placeholder="Select product category"
          isOpen={openDropdown === 'category'}
          onToggle={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
          onClose={() => setOpenDropdown(null)}
          error={touched.category ? errors.category : undefined}
        />

        <View style={styles.spacer} />

        <View style={styles.fieldBody}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell buyers more about your product..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={(t) => t.length <= MAX_DESC_LENGTH && setDescription(t)}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.charCount}>{description.length}/{MAX_DESC_LENGTH}</Text>
        </View>
      </View>

      {category && (
        <View style={styles.smartCard}>
          <Ionicons name="sparkles" size={18} color={Colors.amber} />
          <Text style={styles.smartText}>
            <Text style={styles.smartBold}>Pro Tip: </Text>
            Items in <Text style={styles.smartBold}>{category}</Text> with detailed descriptions sell faster.
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderPricingStep = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      <View style={styles.stepHero}>
        <View style={styles.heroIconCircle}>
          <Ionicons name="cash" size={32} color={Colors.primaryGreen} />
        </View>
        <Text style={styles.stepHeroTitle}>Pricing & Stock</Text>
        <Text style={styles.stepHeroSub}>Set a competitive price and manage your stock</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.pricingRow}>
          <View style={styles.pricingField}>
            <Text style={styles.fieldLabel}>Price (₦) *</Text>
            <View style={styles.prefixInput}>
              <Text style={styles.prefix}>₦</Text>
              <TextInput
                style={[styles.input, styles.prefixInputField, touched.price && errors.price && styles.inputError]}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                value={price}
                onChangeText={handlePriceChange}
                keyboardType="numeric"
                onBlur={() => setTouched((p) => ({ ...p, price: true }))}
              />
            </View>
            {touched.price && errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            {price && !errors.price && (
              <Text style={styles.hintText}>{formatPrice(price)} per {unit || 'unit'}</Text>
            )}
          </View>
          <View style={styles.pricingField}>
            <Text style={styles.fieldLabel}>Stock Quantity *</Text>
            <TextInput
              style={[styles.input, touched.quantity && errors.quantity && styles.inputError]}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={quantity}
              onChangeText={handleQuantityChange}
              keyboardType="numeric"
              onBlur={() => setTouched((p) => ({ ...p, quantity: true }))}
            />
            {touched.quantity && errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
          </View>
        </View>

        <View style={styles.spacer} />

        <DropdownSelect
          label="Unit of Measurement *"
          value={unit}
          options={UNITS}
          onSelect={setUnit}
          placeholder="Select unit"
          isOpen={openDropdown === 'unit'}
          onToggle={() => setOpenDropdown(openDropdown === 'unit' ? null : 'unit')}
          onClose={() => setOpenDropdown(null)}
          error={touched.unit ? errors.unit : undefined}
        />
      </View>

      {totalValue > 0 && (
        <View style={styles.calcCard}>
          <View style={styles.calcHeader}>
            <Ionicons name="calculator-outline" size={16} color={Colors.textDark} />
            <Text style={styles.calcTitle}>Earnings Summary</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Total Listing Value</Text>
            <Text style={styles.calcValue}>₦{totalValue.toLocaleString('en-NG')}</Text>
          </View>
          <View style={styles.calcDivider} />
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Estimated Earnings</Text>
            <Text style={[styles.calcValue, { color: Colors.primaryGreen }]}>₦{estSales.toLocaleString('en-NG')}</Text>
          </View>
          <View style={styles.calcFoot}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textLight} />
            <Text style={styles.calcFootText}>Platform service fee is 10%</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );

  const renderReviewStep = () => {
    const missing: string[] = [];
    if (!title) missing.push('Title');
    if (!category) missing.push('Category');
    if (!price) missing.push('Price');
    if (!quantity) missing.push('Quantity');
    if (!unit) missing.push('Unit');

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
        <View style={styles.stepHero}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="checkmark-circle" size={32} color={Colors.primaryGreen} />
          </View>
          <Text style={styles.stepHeroTitle}>Review Listing</Text>
          <Text style={styles.stepHeroSub}>Double check your details before publishing</Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewCover}>
            {images.length > 0 ? (
              <Image source={{ uri: images[0] }} style={styles.previewCoverImg} />
            ) : (
              <View style={styles.previewCoverPlaceholder}>
                <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.previewBadge}>
              <Ionicons name="images" size={12} color="#fff" />
              <Text style={styles.previewBadgeText}>{images.length} Photos</Text>
            </View>
          </View>
          <View style={styles.previewBody}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle} numberOfLines={2}>{title || 'Product Title'}</Text>
              <Text style={styles.previewPrice}>₦{formatPrice(price)}</Text>
            </View>
            
            <View style={styles.previewMeta}>
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>{category || 'Category'}</Text>
              </View>
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>{quantity} {unit || 'Units'}</Text>
              </View>
            </View>

            {description ? (
              <Text style={styles.previewDesc} numberOfLines={3}>{description}</Text>
            ) : (
              <Text style={[styles.previewDesc, { fontStyle: 'italic', color: Colors.textMuted }]}>No description provided.</Text>
            )}
          </View>
        </View>

        {missing.length > 0 && (
          <View style={styles.missingCard}>
            <Ionicons name="warning" size={18} color={Colors.amber} />
            <Text style={styles.missingText}>
              <Text style={{ fontWeight: '700' }}>Missing: </Text>
              {missing.join(', ')}. Please go back and complete.
            </Text>
          </View>
        )}

        <View style={styles.termsCard}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.primaryGreen} />
          <Text style={styles.termsText}>By publishing, you agree to BuildLinka's Terms of Service and Listing Policies.</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        headerTitle: 'Create Listing',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: Colors.background },
      }} />
      
      <ProgressBar current={step} total={STEPS.length} />

      <KeyboardAwareWrapper 
        ref={scrollRef} 
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]} 
        showsVerticalScrollIndicator={false} 
        onScroll={() => setOpenDropdown(null)} 
        scrollEventThrottle={16} 
        nestedScrollEnabled 
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && renderPhotosStep()}
        {step === 1 && renderDetailsStep()}
        {step === 2 && renderPricingStep()}
        {step === 3 && renderReviewStep()}
      </KeyboardAwareWrapper>

      <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={prevStep} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={Colors.textMedium} />
            <Text style={styles.backText}>Previous</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={Colors.textMedium} />
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            step < STEPS.length - 1 ? styles.nextBtn : styles.submitBtn, 
            !canAdvance && (step < STEPS.length - 1 ? styles.nextBtnDisabled : styles.submitBtnDisabled)
          ]} 
          onPress={step < STEPS.length - 1 ? nextStep : handleSubmit} 
          activeOpacity={0.7}
        >
          <Text style={styles.nextText}>
            {step < STEPS.length - 1 ? 'Continue' : 'Publish Listing'}
          </Text>
          <Ionicons 
            name={step < STEPS.length - 1 ? "arrow-forward" : "rocket"} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },

  progressWrap: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressStep: {
    alignItems: 'center',
    width: 60,
    position: 'relative',
  },
  progressIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    zIndex: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  progressIconActive: {
    backgroundColor: Colors.background,
    borderColor: Colors.primaryGreen,
  },
  progressIconDone: {
    backgroundColor: Colors.primaryGreen,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textLight,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: Colors.primaryGreen,
    fontWeight: '800',
  },
  progressLabelDone: {
    color: Colors.textMedium,
  },
  progressConnector: {
    position: 'absolute',
    height: 2,
    backgroundColor: Colors.surfaceVariant,
    width: '100%',
    top: 14,
    left: '80%', // Connects to next step
    zIndex: 1,
  },
  progressConnectorDone: {
    backgroundColor: Colors.primaryGreen,
  },

  stepHero: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryGreen + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
  },
  stepHeroSub: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  spacer: { height: 20 },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceVariant,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  photoArrow: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  photoIndex: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
  },
  addPhotoCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryGreen + '40',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryGreen + '05',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryGreen,
  },
  addPhotoCount: {
    fontSize: 10,
    color: Colors.textLight,
  },
  photoTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  photoTipText: {
    fontSize: 12,
    color: Colors.textMedium,
    flex: 1,
    lineHeight: 18,
  },

  fieldBody: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textDark,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
    fontWeight: '600',
    paddingLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: Colors.primaryGreen,
    marginTop: 6,
    fontWeight: '700',
    paddingLeft: 4,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 6,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },

  smartCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.amber + '15',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.amber + '30',
  },
  smartText: {
    fontSize: 13,
    color: Colors.textMedium,
    flex: 1,
    lineHeight: 20,
  },
  smartBold: {
    fontWeight: '800',
    color: Colors.textDark,
  },

  pricingRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pricingField: { flex: 1 },
  prefixInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    paddingLeft: 16,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
    marginRight: 4,
  },
  prefixInputField: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 4,
  },

  calcCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  calcLabel: {
    fontSize: 14,
    color: Colors.textMedium,
  },
  calcValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  calcDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginVertical: 8,
    opacity: 0.5,
  },
  calcFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    borderStyle: 'dashed',
  },
  calcFootText: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },

  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  previewCover: {
    height: 180,
    backgroundColor: Colors.surfaceVariant,
  },
  previewCoverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewCoverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  previewBody: {
    padding: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
    flex: 1,
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primaryGreen,
  },
  previewMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  previewTag: {
    backgroundColor: Colors.primaryGreen + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryGreen,
  },
  previewDesc: {
    fontSize: 14,
    color: Colors.textMedium,
    lineHeight: 22,
  },

  missingCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.error + '10',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  missingText: {
    fontSize: 13,
    color: Colors.error,
    flex: 1,
    lineHeight: 18,
  },

  termsCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.primaryGreen + '08',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
    lineHeight: 18,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textMedium,
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryGreen,
    height: 54,
    borderRadius: 16,
    shadowColor: Colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryOrange,
    height: 54,
    borderRadius: 16,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0,
  },

  dropdownWrapper: { zIndex: 1 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },
  dropdownActive: {
    borderColor: Colors.primaryGreen,
  },
  dropdownText: { flex: 1, fontSize: 16, color: Colors.textDark, fontWeight: '500' },
  dropdownPlaceholder: { color: Colors.textMuted },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalDropdownList: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalDropdownScroll: { maxHeight: 300 },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '40',
  },
  dropdownOptionActive: { backgroundColor: Colors.primaryGreen + '08' },
  dropdownOptionText: { flex: 1, fontSize: 16, color: Colors.textDark },
  dropdownOptionTextActive: { fontWeight: '800', color: Colors.primaryGreen },
});
