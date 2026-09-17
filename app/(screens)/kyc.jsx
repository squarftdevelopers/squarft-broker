import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchKyc, uploadKyc, logout, setKycCompleted, fetchUserProfile } from '../../store/slices/authSlice';


const isApprovedStatus = (status) => status === 'verified';
const isReviewStatus = (status) => ['under_review'].includes(String(status || '').toLowerCase());

const statusMeta = {
  verified: {
    icon: 'check-decagram-outline',
    color: '#16A34A',
    bg: '#DCFCE7',
    title: 'KYC Approved',
    message: 'Your KYC has been approved. You can continue using the broker dashboard.',
    action: 'Continue to Dashboard',
  },
  under_review: {
    icon: 'clock-outline',
    color: '#CA8A04',
    bg: '#FEF9C3',
    title: 'KYC Under Review',
    message: 'Your documents have been submitted. App access will unlock after admin approval.',
    action: 'Refresh Status',
  },
};

const UploadBox = ({ label, value, existingUrl, icon, onPress, onRemove, useCamera, disabled }) => (
  <View style={styles.fieldBlock}>
    <Text style={styles.label}>{label}</Text>
    {value || existingUrl ? (
      <View style={styles.uploadedCard}>
        <View style={styles.fileRow}>
          <View style={styles.fileIcon}>
            <MaterialCommunityIcons name={useCamera ? 'camera' : 'file-image-outline'} size={20} color="#4A43EC" />
          </View>
          <Text style={styles.fileName} numberOfLines={1}>
            {value?.fileName || 'Document uploaded'}
          </Text>
          {value ? (
            <Pressable disabled={disabled} onPress={onRemove} style={styles.removeButton}>
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </Pressable>
          ) : (
            <Pressable disabled={disabled} onPress={onPress} style={styles.replaceButton}>
              <Text style={styles.replaceText}>Replace</Text>
            </Pressable>
          )}
        </View>
        <Image source={{ uri: value?.uri || existingUrl }} style={styles.preview} resizeMode="cover" />
      </View>
    ) : (
      <Pressable disabled={disabled} onPress={onPress} style={styles.uploadBox}>
        <View style={styles.uploadIcon}>
          <MaterialCommunityIcons name={icon} size={28} color="#4A43EC" />
        </View>
        <Text style={styles.uploadTitle}>{useCamera ? 'Take Selfie or Upload' : 'Upload Image'}</Text>
        <Text style={styles.uploadHint}>JPG, PNG, or WEBP · Maximum 5 MB</Text>
      </Pressable>
    )}
  </View>
);

export default function KycScreen() {
  const dispatch = useDispatch();
  const { token, kyc } = useSelector((state) => state.auth);
  const submittingRef = useRef(false);
  const [fetchWarnMsg, setFetchWarnMsg] = useState('');
  const [remoteKyc, setRemoteKyc] = useState(kyc || null);
  const [status, setStatus] = useState(remoteKyc?.verification_status || 'missing');
  const [rejectionReason, setRejectionReason] = useState('');
  const [fetchingKyc, setFetchingKyc] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [aadharFront, setAadharFront] = useState(null);
  const [panCard, setPanCard] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const loadKycStatus = useCallback(async (preserveDraft = false) => {
    if (!preserveDraft) setFetchingKyc(true);
    setFetchWarnMsg('');
    try {
      // unwrap: fulfilled=data|null, rejected=throws
      const rawData = token
        ? await dispatch(fetchKyc()).unwrap().catch((err) =>
            // 'KYC not found' or 'No auth token found' → treat as no-KYC-yet
            null
          )
        : null;
      const normalized = rawData || { verification_status: 'missing' };
      setRemoteKyc(normalized);
      if (!preserveDraft) {
        setAadharNumber(normalized.aadhar_number || '');
        setPanNumber(normalized.pan_number || '');
      }
      setStatus(
        normalized.verification_status === 'pending'
          ? 'under_review'
          : normalized.verification_status || 'missing'
      );
      setRejectionReason(normalized.rejection_reason || '');
      dispatch(setKycCompleted(normalized.verification_status === 'verified'));
    } catch (error) {
      // Non-fatal: fall back to upload form and show a small warning
      setStatus('missing');
      setFetchWarnMsg('Could not load existing KYC info. You can still upload your documents.');
    } finally {
      setFetchingKyc(false);
    }
  }, [token, dispatch]);

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try { await loadKycStatus(true); } finally { setRefreshing(false); }
  };

  useEffect(() => {
    loadKycStatus();
  }, [loadKycStatus]);

  const pickImage = async (setter, useCamera = false) => {
    if (submittingRef.current) return;
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert('Permission Needed', useCamera ? 'Camera permission is required.' : 'Photo library permission is required.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            cameraType: ImagePicker.CameraType.front,
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
          });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Image Too Large', 'Please select an image smaller than 5 MB.');
          return;
        }
        setter(asset);
      }
    } catch (error) {
      Alert.alert('Unable to Open Photo', error.message || 'Please try again.');
    }
  };

  const pickSelfie = () => {
    Alert.alert(
      'Profile Photo',
      'Take a new selfie or upload one from your gallery.',
      [
        { text: 'Take Selfie', onPress: () => pickImage(setProfilePhoto, true) },
        { text: 'Upload from Gallery', onPress: () => pickImage(setProfilePhoto, false) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleSubmit = async () => {
    if (submittingRef.current || !token) return;
    const cleanAadhaar = aadharNumber.replace(/\D/g, '');
    const cleanPan = panNumber.trim().toUpperCase();
    if ((!profilePhoto && !remoteKyc?.profile_photo_url) || (!aadharFront && !remoteKyc?.aadhar_front_url)
      || (!aadharBack && !remoteKyc?.aadhar_back_url) || (!panCard && !remoteKyc?.pan_card_url)) {
      Alert.alert('Incomplete KYC', 'Please upload profile photo, Aadhaar front, Aadhaar back, and PAN card.');
      return;
    }
    if (cleanAadhaar.length !== 12) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
      Alert.alert('Invalid PAN', 'Please enter a valid PAN number.');
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await dispatch(uploadKyc({
        profilePhoto, aadharFront, aadharBack, panCard,
        aadharNumber: cleanAadhaar, panNumber: cleanPan, existing: !!remoteKyc?.id,
      })).unwrap();
      const nextStatus = 'under_review';
      setRemoteKyc({ ...(remoteKyc || {}), verification_status: nextStatus });
      setStatus(nextStatus);
      dispatch(setKycCompleted(false));
      setRejectionReason('');
      setProfilePhoto(null);
      setAadharFront(null);
      setAadharBack(null);
      setPanCard(null);
      await dispatch(fetchKyc());
      dispatch(fetchUserProfile());
      router.replace('/(tabs)/home');
    } catch (error) {
      await loadKycStatus();
      Alert.alert('KYC Failed', error.message || 'Unable to submit KYC. Please try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (submittingRef.current) return;
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  const handleBack = () => {
    if (submittingRef.current) return;
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/settings');
  };

  const currentStatus = String(status || '').toLowerCase();
  const showStatusOnly = isApprovedStatus(currentStatus) || isReviewStatus(currentStatus);
  const meta = isApprovedStatus(currentStatus) ? statusMeta.verified : statusMeta.under_review;
  const isRejected = currentStatus === 'rejected';

  if (!token) return <Redirect href="/(auth)/login" />;

  if (fetchingKyc) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4A43EC" />
        <Text style={styles.loaderText}>Loading KYC status...</Text>
      </View>
    );
  }

  if (false && showStatusOnly) {
    return (
      <SafeAreaView style={{flex: 1}}><ScrollView contentContainerStyle={[styles.statusContainer, {flexGrow: 1}]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4A43EC"]} tintColor="#4A43EC" />} alwaysBounceVertical>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.statusIcon, { backgroundColor: meta.bg }]}>
          <MaterialCommunityIcons name={meta.icon} size={54} color={meta.color} />
        </View>
        <Text style={styles.statusTitle}>{meta.title}</Text>
        <Text style={styles.statusMessage}>{meta.message}</Text>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: meta.color }]}
          onPress={() => {
            if (isApprovedStatus(currentStatus)) {
              router.replace('/(tabs)/home');
            } else {
              loadKycStatus();
            }
          }}
        >
          {fetchingKyc ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{meta.action}</Text>}
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryButtonText}>Log Out</Text>
        </Pressable>
      </ScrollView></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable disabled={submitting} onPress={handleBack} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4A43EC"]} tintColor="#4A43EC" />} alwaysBounceVertical
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isRejected && (
            <View style={styles.rejectedBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.rejectedText}>
                Your KYC was rejected{rejectionReason ? `: ${rejectionReason}` : '. Please re-upload valid documents.'}
              </Text>
            </View>
          )}

          <Text style={styles.subtitle}>
            {isRejected
              ? 'Update the rejected documents and re-submit your KYC for admin approval.'
              : 'Upload all identity documents. Dashboard access unlocks after admin approval.'}
          </Text>

          <UploadBox
            disabled={submitting}
            label="Profile Photo / Selfie"
            value={profilePhoto}
            existingUrl={remoteKyc?.profile_photo_url}
            icon="camera-outline"
            useCamera
            onPress={pickSelfie}
            onRemove={() => setProfilePhoto(null)}
          />
          <UploadBox
            disabled={submitting}
            label="Aadhaar Front"
            value={aadharFront}
            existingUrl={remoteKyc?.aadhar_front_url}
            icon="cloud-upload-outline"
            onPress={() => pickImage(setAadharFront)}
            onRemove={() => setAadharFront(null)}
          />
          <UploadBox
            disabled={submitting}
            label="Aadhaar Back"
            value={aadharBack}
            existingUrl={remoteKyc?.aadhar_back_url}
            icon="cloud-upload-outline"
            onPress={() => pickImage(setAadharBack)}
            onRemove={() => setAadharBack(null)}
          />
          <UploadBox
            disabled={submitting}
            label="PAN Card"
            value={panCard}
            existingUrl={remoteKyc?.pan_card_url}
            icon="card-account-details-outline"
            onPress={() => pickImage(setPanCard)}
            onRemove={() => setPanCard(null)}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Aadhaar Number</Text>
            <TextInput value={aadharNumber} editable={!submitting}
              onChangeText={(value) => setAadharNumber(value.replace(/\D/g, '').slice(0, 12))}
              keyboardType="number-pad" maxLength={12} underlineColorAndroid="transparent"
              placeholder="Enter 12-digit Aadhaar number" placeholderTextColor="#9CA3AF" style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PAN Number</Text>
            <TextInput value={panNumber} editable={!submitting}
              onChangeText={(value) => setPanNumber(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              autoCapitalize="characters" maxLength={10} underlineColorAndroid="transparent"
              placeholder="ABCDE1234F" placeholderTextColor="#9CA3AF" style={styles.input} />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.disabledButton]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>{isRejected ? 'Re-submit KYC' : 'Submit KYC'}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  loaderContainer: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: '#6B7280', fontSize: 14, marginTop: 12 },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerSpacer: { width: 28 },
  headerBackButton: { padding: 4 },
  headerTitle: { color: '#111827', fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 42 },
  subtitle: { color: '#6B7280', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 24 },
  rejectedBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rejectedText: { color: '#B91C1C', fontSize: 13, lineHeight: 19, flex: 1 },
  fieldBlock: { marginBottom: 22 },
  label: { color: '#374151', fontSize: 14, fontWeight: '700', marginBottom: 9 },
  uploadBox: {
    height: 158,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#B9C5FF',
    backgroundColor: '#F7F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: { color: '#111827', fontSize: 14, fontWeight: '700' },
  uploadHint: { color: '#9CA3AF', fontSize: 11, marginTop: 4 },
  uploadedCard: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, backgroundColor: '#FFFFFF' },
  fileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F4F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fileName: { flex: 1, color: '#111827', fontSize: 13, fontWeight: '700' },
  removeButton: { backgroundColor: '#FEF2F2', borderRadius: 20, padding: 8 },
  replaceButton: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  replaceText: { color: '#4A43EC', fontSize: 12, fontWeight: '700' },
  preview: { width: '100%', height: 178, borderRadius: 12 },
  inputGroup: { marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    color: '#111827', fontSize: 15, backgroundColor: '#FFFFFF',
  },
  submitButton: { backgroundColor: '#4A43EC', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  disabledButton: { opacity: 0.7 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  statusContainer: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  statusIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  statusTitle: { color: '#111827', fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  statusMessage: { color: '#6B7280', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  primaryButton: { minWidth: 190, borderRadius: 14, alignItems: 'center', paddingVertical: 15, paddingHorizontal: 22, marginTop: 30 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 22 },
  secondaryButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
