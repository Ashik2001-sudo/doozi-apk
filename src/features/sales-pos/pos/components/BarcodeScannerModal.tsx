import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Flashlight, FlashlightOff, ScanLine, Settings, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme/tokens';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

const BARCODE_TYPES = [
  'qr',
  'code128',
  'code39',
  'code93',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'itf14',
  'codabar',
  'datamatrix',
  'pdf417',
] as const;

/** Seller-admin style: QR square + centered barcode strip with pulsing laser. */
function ScanGuideOverlay({ active }: { active: boolean }) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0.45);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  return (
    <View style={styles.guideRoot} pointerEvents="none">
      <View style={styles.guideSquare}>
        {/* QR square */}
        <View style={styles.qrBox}>
          <Text style={styles.qrLabel}>QR</Text>
          <View style={[styles.qrCorner, styles.qrCornerTL]} />
          <View style={[styles.qrCorner, styles.qrCornerTR]} />
          <View style={[styles.qrCorner, styles.qrCornerBL]} />
          <View style={[styles.qrCorner, styles.qrCornerBR]} />
        </View>

        {/* Barcode strip — wide, centered (same as seller-admin) */}
        <View style={styles.barcodeStrip}>
          <Text style={styles.barcodeLabel}>Barcode</Text>
          <Animated.View style={[styles.barcodeLaser, { opacity: pulse }]} />
        </View>
      </View>

      <Text style={styles.guideHint}>Align QR in the square or barcode on the line</Text>
    </View>
  );
}

export function BarcodeScannerModal({
  visible,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scanLocked = useRef(false);

  useEffect(() => {
    if (!visible) {
      scanLocked.current = false;
      setTorchOn(false);
      setCameraReady(false);
      setCameraError('');
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    const value = String(data || '').trim();
    if (!value || scanLocked.current) return;
    scanLocked.current = true;
    setTorchOn(false);
    onScan(value);
  };

  const renderPermissionState = () => {
    if (!permission) {
      return (
        <View style={styles.stateWrap}>
          <ActivityIndicator color="#ffffff" size="large" />
          <Text style={styles.stateText}>Checking camera permission…</Text>
        </View>
      );
    }

    if (permission.granted) return null;

    return (
      <View style={styles.stateWrap}>
        <View style={styles.stateIcon}>
          <ScanLine color="#ffffff" size={30} />
        </View>
        <Text style={styles.stateTitle}>Camera access needed</Text>
        <Text style={styles.stateText}>
          Allow camera access to scan QR codes, product barcodes, SKU and IMEI labels.
        </Text>
        {permission.canAskAgain ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => void requestPermission()}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Allow camera</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => void Linking.openSettings()}
            activeOpacity={0.8}
          >
            <Settings color="#ffffff" size={17} />
            <Text style={styles.primaryButtonText}>Open settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchOn}
            barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
            onBarcodeScanned={scanLocked.current ? undefined : handleBarcodeScanned}
            onCameraReady={() => setCameraReady(true)}
            onMountError={(event) => setCameraError(event.message || 'Camera could not start')}
          />
        ) : null}

        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.roundButton} onPress={onClose} activeOpacity={0.75}>
            <X color="#ffffff" size={22} />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Scan Barcode / QR Code</Text>
            <Text style={styles.subtitle}>QR · Barcode · SKU · IMEI</Text>
          </View>
          <TouchableOpacity
            style={[styles.roundButton, torchOn && styles.roundButtonOn]}
            onPress={() => setTorchOn((current) => !current)}
            disabled={!permission?.granted || !!cameraError}
            activeOpacity={0.75}
          >
            {torchOn ? (
              <FlashlightOff color="#ffffff" size={20} />
            ) : (
              <Flashlight color="#ffffff" size={20} />
            )}
          </TouchableOpacity>
        </View>

        {permission?.granted && !cameraError ? (
          <ScanGuideOverlay active={cameraReady} />
        ) : null}

        {permission?.granted && !cameraReady && !cameraError ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#ffffff" size="large" />
            <Text style={styles.stateText}>Starting camera…</Text>
          </View>
        ) : null}

        {cameraError ? (
          <View style={styles.stateWrap}>
            <Text style={styles.stateTitle}>Camera unavailable</Text>
            <Text style={styles.stateText}>{cameraError}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setCameraError('');
                setCameraReady(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderPermissionState()
        )}

        <View style={[styles.bottomHint, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <ScanLine color="#ffffff" size={17} />
          <Text style={styles.bottomHintText}>Scanning automatically</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  topBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
    backgroundColor: 'rgba(2,6,23,0.72)',
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  roundButtonOn: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  titleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },

  guideRoot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  guideSquare: {
    width: '72%',
    maxWidth: 280,
    aspectRatio: 1,
    position: 'relative',
  },
  qrBox: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(129,140,248,0.85)',
    backgroundColor: 'transparent',
  },
  qrLabel: {
    position: 'absolute',
    top: -22,
    left: 0,
    color: '#a5b4fc',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  qrCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#c7d2fe',
  },
  qrCornerTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 2 },
  qrCornerTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 2 },
  qrCornerBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 2 },
  qrCornerBR: { right: 0, bottom: 0, borderRightWidth: 2, borderBottomWidth: 2, borderBottomRightRadius: 2 },

  barcodeStrip: {
    position: 'absolute',
    left: '-4%',
    right: '-4%',
    top: '39%',
    height: '22%',
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(52,211,153,0.9)',
    backgroundColor: 'rgba(16,185,129,0.08)',
    justifyContent: 'center',
  },
  barcodeLabel: {
    position: 'absolute',
    top: -20,
    left: 0,
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  barcodeLaser: {
    marginHorizontal: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(52,211,153,0.85)',
    shadowColor: '#34d399',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  guideHint: {
    position: 'absolute',
    bottom: 88,
    left: 16,
    right: 16,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#020617',
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: '#020617',
  },
  stateIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.5)',
    marginBottom: 18,
  },
  stateTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  stateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  primaryButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: '#4f46e5',
    marginTop: 22,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  bottomHint: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingTop: 14,
    backgroundColor: 'rgba(2,6,23,0.72)',
  },
  bottomHintText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
});
