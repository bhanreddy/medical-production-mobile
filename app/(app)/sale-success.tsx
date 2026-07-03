import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, Path, Group } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { useSale, useInvoice } from '@/hooks/useSales';
import { formatCurrency } from '@/utils/format';
import { printReceiptHtml } from '@/utils/printReceipt';
import { useUIStore } from '@/stores/uiStore';

function goToNewSale() {
  router.replace('/(app)/(tabs)/pos');
}

export default function SaleSuccessScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const addToast = useUIStore(s => s.addToast);
  const { data: sale, isLoading } = useSale(id as string);
  const { data: invoiceData, isLoading: isLoadingInvoice, refetch: refetchInvoice } = useInvoice(id as string);
  const [isPrinting, setIsPrinting] = useState(false);

  const strokeEnd = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const fadeDetails = useSharedValue(0);

  useEffect(() => {
    strokeEnd.value = withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }, () => {
      checkProgress.value = withTiming(1, { duration: 400, easing: Easing.bounce });
    });
    fadeDetails.value = withDelay(800, withTiming(1, { duration: 400 }));
  }, [strokeEnd, checkProgress, fadeDetails]);

  const handleNewSale = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goToNewSale();
  };

  const handlePrint = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPrinting(true);
    try {
      let html = invoiceData?.html;
      if (!html?.trim()) {
        const refreshed = await refetchInvoice();
        html = refreshed.data?.html;
      }
      await printReceiptHtml(html);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to print receipt', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const detailsAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeDetails.value,
    transform: [{ translateY: (1 - fadeDetails.value) * 20 }],
  }));

  const buildCheckPath = () => 'M 30 60 L 50 80 L 90 35';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, paddingTop: insets.top }]}>
      <View style={styles.animationContainer}>
        <Canvas style={{ width: 120, height: 120 }}>
          <Group color={theme.colors.success} style="stroke" strokeWidth={8} strokeCap="round" strokeJoin="round">
            <Path path="M60,10 A50,50 0 1,1 59.9,10" end={strokeEnd} />
            <Path path={buildCheckPath()} end={checkProgress} />
          </Group>
        </Canvas>
      </View>

      <Animated.View style={[styles.detailsContainer, detailsAnimStyle]}>
        <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.typography.family.bold, fontSize: 28 }]}>
          Sale Complete!
        </Text>

        {isLoading ? (
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Loading details...</Text>
        ) : (
          <View style={[styles.receiptCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.colors.text.secondary }]}>Invoice</Text>
              <Text style={[styles.receiptValue, { color: theme.colors.text.primary, fontFamily: theme.typography.family.semiBold }]}>
                {sale?.invoiceNumber || 'INV-0000'}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.colors.text.secondary }]}>Total</Text>
              <Text style={[styles.receiptValue, { color: theme.colors.primary, fontFamily: theme.typography.family.bold, fontSize: 20 }]}>
                {formatCurrency(sale?.grandTotal || 0)}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.colors.text.secondary }]}>Payment</Text>
              <Text style={[styles.receiptValue, { color: theme.colors.text.primary, textTransform: 'capitalize' }]}>
                {sale?.paymentMode || 'Cash'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btnOutline, { borderColor: theme.colors.primary, opacity: isPrinting || isLoadingInvoice ? 0.7 : 1 }]}
            onPress={() => void handlePrint()}
            disabled={isPrinting || isLoadingInvoice}
          >
            {isPrinting || isLoadingInvoice ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={[styles.btnOutlineText, { color: theme.colors.primary, fontFamily: theme.typography.family.semiBold }]}>
                Print Receipt
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnSolid, { backgroundColor: theme.colors.primary }]} onPress={handleNewSale}>
            <Text style={[styles.btnSolidText, { fontFamily: theme.typography.family.semiBold }]}>New Sale</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.hintText, { color: theme.colors.text.tertiary, fontFamily: theme.typography.family.regular }]}>
          Tap New Sale when you are ready for the next bill.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    marginTop: 16,
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  receiptCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptLabel: {
    fontSize: 16,
  },
  receiptValue: {
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
    marginBottom: 16,
  },
  btnOutline: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOutlineText: {
    fontSize: 16,
  },
  btnSolid: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSolidText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  hintText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
