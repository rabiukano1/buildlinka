import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { WORKERS, TRADES, type Worker } from '../constants/MockData';
import SearchBar from '../components/SearchBar';
import WorkerCard from '../components/WorkerCard';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const TRADE_ICONS: Record<string, string> = {
  All: 'people',
  Mason: 'architecture',
  Electrician: 'bolt',
  Plumber: 'water',
  Carpenter: 'handyman',
  Painter: 'format-paint',
  Welder: 'whatshot',
  Tiler: 'grid-view',
  Designer: 'palette',
};

export default function WorkersMarketplaceScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireDate, setHireDate] = useState('');
  const [hireDuration, setHireDuration] = useState('');
  const [hireDescription, setHireDescription] = useState('');
  const [hireSubmitted, setHireSubmitted] = useState(false);

  const filterAnim = useRef(new Animated.Value(0)).current;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredWorkers = useMemo(() => {
    let list = WORKERS;

    if (selectedTrade !== 'All') {
      list = list.filter((w) =>
        w.trade.toLowerCase().includes(selectedTrade.toLowerCase())
      );
    }

    if (availableOnly) {
      list = list.filter((w) => w.available);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.trade.toLowerCase().includes(q) ||
          w.skills.some((s) => s.toLowerCase().includes(q)) ||
          w.location.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery, selectedTrade, availableOnly]);

  const handleHire = (worker: Worker) => {
    if (!worker.available) return;
    setSelectedWorker(worker);
    setHireDate('');
    setHireDuration('');
    setHireDescription('');
    setHireSubmitted(false);
    setShowHireModal(true);
  };

  const submitHireRequest = () => {
    setHireSubmitted(true);
  };

  const resetHireModal = () => {
    setShowHireModal(false);
    setSelectedWorker(null);
    setHireSubmitted(false);
  };

  const renderWorker = ({ item }: { item: Worker }) => (
    <WorkerCard
      worker={item}
      onPress={() => handleHire(item)}
    />
  );

  const renderHeader = () => (
    <View>
      <TouchableOpacity style={styles.nearbyStrip} onPress={() => router.push('/nearby' as any)} activeOpacity={0.7}>
        <MaterialIcons name="near-me" size={18} color={Colors.primary} />
        <Text style={styles.nearbyStripText}>Find workers & jobs near you</Text>
        <MaterialIcons name="chevron-right" size={18} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.topBar}>
        <SearchBar
          placeholder="Search workers by name, skill, or location..."
          onSearch={setSearchQuery}
        />
      </View>

      <View style={styles.chipStrip}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TRADES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.chipStripInner}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tradeChip, selectedTrade === item && styles.tradeChipActive]}
              onPress={() => setSelectedTrade(item)}
            >
              <MaterialIcons
                name={(TRADE_ICONS[item] || 'work') as any}
                size={15}
                color={selectedTrade === item ? '#fff' : Colors.textMedium}
              />
              <Text
                style={[
                  styles.tradeChipText,
                  selectedTrade === item && styles.tradeChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.quickFilters}>
        <TouchableOpacity
          style={[styles.qfBtn, availableOnly && styles.qfBtnActive]}
          onPress={() => setAvailableOnly(!availableOnly)}
        >
          <MaterialIcons
            name="check-circle"
            size={16}
            color={availableOnly ? '#fff' : Colors.lightGreen}
          />
          <Text style={[styles.qfBtnText, availableOnly && styles.qfBtnTextActive]}>
            Available Only
          </Text>
        </TouchableOpacity>
        <View style={styles.qfSpacer} />
        <View style={styles.qfCount}>
          <Text style={styles.qfCountText}>{filteredWorkers.length}</Text>
          <Text style={styles.qfCountLabel}>pros</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Workers Marketplace',
          headerBackTitle: 'Back',
          headerTintColor: Colors.primary,
        }}
      />
      <FlatList
        data={filteredWorkers}
        renderItem={renderWorker}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryGreen} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="person-search" size={52} color={Colors.border} />
            <Text style={styles.emptyTitle}>No workers found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />

      <Modal
        visible={showHireModal}
        animationType="slide"
        transparent
        onRequestClose={resetHireModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {hireSubmitted ? (
              <View style={styles.modalSuccess}>
                <MaterialIcons name="check-circle" size={64} color={Colors.success} />
                <Text style={styles.modalSuccessTitle}>Hire Request Sent!</Text>
                <Text style={styles.modalSuccessText}>
                  Your hire request for {selectedWorker?.name} has been submitted.
                  They will review and respond shortly.
                </Text>
                <TouchableOpacity style={styles.modalDoneBtn} onPress={resetHireModal}>
                  <Text style={styles.modalDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Hire {selectedWorker?.name}</Text>
                  <TouchableOpacity onPress={resetHireModal}>
                    <MaterialIcons name="close" size={24} color={Colors.textMedium} />
                  </TouchableOpacity>
                </View>

                {selectedWorker && (
                  <View style={styles.modalWorkerInfo}>
                    <Text style={styles.modalWorkerEmoji}>{selectedWorker.avatar}</Text>
                    <View style={styles.modalWorkerDetails}>
                      <Text style={styles.modalWorkerName}>{selectedWorker.name}</Text>
                      <Text style={styles.modalWorkerTrade}>{selectedWorker.trade}</Text>
                      <Text style={styles.modalWorkerRate}>
                        {formatPrice(selectedWorker.dailyRate)} / day
                      </Text>
                    </View>
                  </View>
                )}

                <ScrollView
                  style={[styles.modalForm, { maxHeight: 400 }]}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.formLabel}>Start Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 15 June 2026"
                    placeholderTextColor={Colors.textMuted}
                    value={hireDate}
                    onChangeText={setHireDate}
                  />

                  <Text style={styles.formLabel}>Duration (days)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 5"
                    placeholderTextColor={Colors.textMuted}
                    value={hireDuration}
                    onChangeText={setHireDuration}
                    keyboardType="number-pad"
                  />

                  <Text style={styles.formLabel}>Job Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    placeholder="Describe the work to be done..."
                    placeholderTextColor={Colors.textMuted}
                    value={hireDescription}
                    onChangeText={setHireDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  {selectedWorker && hireDate && hireDuration && (
                    <View style={styles.modalSummary}>
                      <Text style={styles.modalSummaryTitle}>Estimated Cost</Text>
                      <View style={styles.modalSummaryRow}>
                        <Text style={styles.modalSummaryLabel}>Daily Rate</Text>
                        <Text style={styles.modalSummaryValue}>
                          {formatPrice(selectedWorker.dailyRate)}
                        </Text>
                      </View>
                      <View style={styles.modalSummaryRow}>
                        <Text style={styles.modalSummaryLabel}>Duration</Text>
                        <Text style={styles.modalSummaryValue}>{hireDuration} day(s)</Text>
                      </View>
                      <View style={[styles.modalSummaryRow, styles.modalSummaryTotal]}>
                        <Text style={styles.modalSummaryTotalLabel}>Estimated Total</Text>
                        <Text style={styles.modalSummaryTotalValue}>
                          {formatPrice(selectedWorker.dailyRate * parseInt(hireDuration || '0'))}
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (!hireDate || !hireDuration) && styles.submitBtnDisabled,
                    ]}
                    disabled={!hireDate || !hireDuration}
                    onPress={submitHireRequest}
                  >
                    <MaterialIcons name="send" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Send Hire Request</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ─── Top bar ─── */
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },

  /* ─── Trade chips ─── */
  chipStrip: {
    marginTop: 10,
  },
  chipStripInner: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  tradeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tradeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  tradeChipTextActive: {
    color: '#fff',
  },

  /* ─── Quick filters ─── */
  quickFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  qfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  qfBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  qfBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  qfBtnTextActive: {
    color: '#fff',
  },
  qfSpacer: {
    flex: 1,
  },
  qfCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: Colors.primaryGreen,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qfCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  qfCountLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '500',
  },

  /* ─── FlatList ─── */
  listHeader: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },

  /* ─── Empty ─── */
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textLight,
  },

  /* ─── Hire Modal ─── */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
  },
  modalWorkerInfo: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  modalWorkerEmoji: {
    fontSize: 36,
  },
  modalWorkerDetails: {
    flex: 1,
    gap: 2,
  },
  modalWorkerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  modalWorkerTrade: {
    fontSize: 13,
    color: Colors.primaryGreen,
    fontWeight: '600',
  },
  modalWorkerRate: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },
  modalForm: {
    gap: 0,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textDark,
  },
  formTextArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  modalSummary: {
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  modalSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 4,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSummaryLabel: {
    fontSize: 13,
    color: Colors.textMedium,
  },
  modalSummaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  modalSummaryTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: 8,
    marginTop: 4,
  },
  modalSummaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  modalSummaryTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.secondary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingVertical: 14,
    marginTop: 20,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.border,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  /* ─── Hire Success ─── */
  modalSuccess: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  modalSuccessTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textDark,
  },
  modalSuccessText: {
    fontSize: 14,
    color: Colors.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalDoneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingHorizontal: 40,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalDoneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* ─── Nearby Strip ─── */
  nearbyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '0C',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '18',
  },
  nearbyStripText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
