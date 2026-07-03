import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/format';

export type UpiModalState = 'closed' | 'missing_config' | 'qr';

interface UpiPaymentSheetProps {
  state: UpiModalState;
  shopName: string;
  upiId: string;
  amount: number;
  qrValue: string;
  isConfirming?: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
}

export function UpiPaymentSheet({
  state,
  shopName,
  upiId,
  amount,
  qrValue,
  isConfirming = false,
  onClose,
  onConfirmPayment,
}: UpiPaymentSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const visible = state !== 'closed';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          {state === 'missing_config' ? (
            <>
              <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.typography.family.bold }]}>
                UPI not configured
              </Text>
              <Text style={[styles.body, { color: theme.colors.text.secondary }]}>
                Save your shop UPI ID in web Settings → Payment settings, then sync and try again.
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btnGhost, { borderColor: theme.colors.border }]} onPress={onClose}>
                  <Text style={{ color: theme.colors.text.primary, fontFamily: theme.typography.family.semiBold }}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.typography.family.bold }]}>
                Scan to pay (UPI)
              </Text>
              <Text style={[styles.shopName, { color: theme.colors.text.primary, fontFamily: theme.typography.family.semiBold }]}>
                {shopName}
              </Text>
              <Text style={[styles.upiId, { color: theme.colors.text.secondary }]}>{upiId}</Text>
              <Text style={[styles.amount, { color: theme.colors.primary, fontFamily: theme.typography.family.bold }]}>
                {formatCurrency(amount)}
              </Text>
              {qrValue ? (
                <View style={styles.qrWrap}>
                  <QRCode value={qrValue} size={200} />
                </View>
              ) : (
                <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />
              )}
              <Text style={[styles.hint, { color: theme.colors.text.secondary }]}>
                Scan with GPay, PhonePe, Paytm, or BHIM
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btnGhost, { borderColor: theme.colors.border }]}
                  onPress={onClose}
                  disabled={isConfirming}
                >
                  <Text style={{ color: theme.colors.text.primary, fontFamily: theme.typography.family.semiBold }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnPrimary, { backgroundColor: theme.colors.success, opacity: isConfirming ? 0.7 : 1 }]}
                  onPress={onConfirmPayment}
                  disabled={isConfirming}
                >
                  {isConfirming ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontFamily: theme.typography.family.bold }}>Payment received ✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  shopName: {
    fontSize: 17,
    marginBottom: 4,
  },
  upiId: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  amount: {
    fontSize: 28,
    marginBottom: 16,
  },
  qrWrap: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnGhost: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
