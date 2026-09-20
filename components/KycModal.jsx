import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router, usePathname } from 'expo-router';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { fetchKyc } from '../store/slices/authSlice';

const KycModal = () => {
    const dispatch = useDispatch();
    const pathname = usePathname();
    const bottomSheetModalRef = useRef(null);
    const { isKycCompleted, kycChecked, kycLoading, token, kyc } = useSelector((state) => state.auth);
    const kycStatus = String(kyc?.verification_status || '').toLowerCase();
    const isSubmitted = ['pending', 'submitted', 'under_review', 'in_review'].includes(kycStatus);
    const isRejected = kycStatus === 'rejected';

    const snapPoints = useMemo(() => ['92%'], []);
    const shouldHideForRoute = pathname.includes('kyc');
    const isApproved = ['approved', 'verified'].includes(kycStatus) || isKycCompleted;
    const shouldPromptKyc = Boolean(token) && kycChecked && !isApproved && !shouldHideForRoute;

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.5}
                pressBehavior="none"
            />
        ),
        []
    );

    useEffect(() => {
        if (token && !kycChecked && !kycLoading) {
            dispatch(fetchKyc());
        }
    }, [dispatch, kycChecked, kycLoading, token]);

    useEffect(() => {
        if (shouldPromptKyc) {
            const timer = setTimeout(() => {
                bottomSheetModalRef.current?.present();
            }, 250);
            return () => clearTimeout(timer);
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [shouldPromptKyc, pathname, isApproved, kycStatus]);

    const [refreshing, setRefreshing] = useState(false);
    const isRefreshing = isSubmitted && (refreshing || kycLoading);

    const handleKycAction = async () => {
        if (isSubmitted) {
            if (refreshing || kycLoading) return;
            setRefreshing(true);
            try {
                await dispatch(fetchKyc()).unwrap();
            } catch (err) {
                console.log('[KycModal] fetchKyc error:', err);
            } finally {
                setRefreshing(false);
            }
            return;
        }
        bottomSheetModalRef.current?.dismiss();
        router.push('/(screens)/kyc');
    };

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            enablePanDownToClose={false}
            enableDismissOnClose={false}
            handleComponent={null}
            backgroundStyle={styles.bottomSheetBackground}
        >
            <BottomSheetView style={styles.contentContainer}>
                {/* Top Visual Section with Blue Header and Illustration */}
                <View style={styles.visualContainer}>
                    {/* Blue header background covering top part */}
                    <View style={styles.blueHeaderBg} />

                    {/* Centered white handle pill inside the blue header */}
                    <View style={styles.handleBar} />

                    {/* KYC Illustration Image */}
                    <Image
                        source={require('../assets/images/kyc-sheet.png')}
                        style={styles.illustrationImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, isRejected && styles.rejectedTitle]}>
                        {isRejected ? 'KYC Rejected' : isSubmitted ? 'KYC Submitted' : 'Please Complete Your KYC'}
                    </Text>
                    <Text style={styles.description}>
                        {isRejected
                            ? (kyc?.rejection_reason
                                ? `Reason: ${kyc.rejection_reason}`
                                : 'Your documents did not meet the requirements. Please re-upload valid documents.')
                            : isSubmitted
                            ? 'Your KYC is submitted for admin review. Access will unlock after approval.'
                            : 'Complete your KYC to start uploading your property and reach potential buyers.'}
                    </Text>
                </View>

                {/* Bottom Button Container with top border */}
                <View style={styles.bottomBar}>
                    <Pressable
                        style={[styles.completeButton, isRefreshing && styles.disabledButton]}
                        onPress={handleKycAction}
                        disabled={isRefreshing}
                        android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
                    >
                        {isRefreshing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.completeButtonText}>
                                {isSubmitted ? 'Refresh Status' : isRejected ? 'Re-upload Documents' : 'Complete KYC'}
                            </Text>
                        )}
                    </Pressable>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    bottomSheetBackground: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    visualContainer: {
        width: '100%',
        height: 370,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    blueHeaderBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 270,
        backgroundColor: '#4A43EC',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    handleBar: {
        width: 48,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        position: 'absolute',
        top: 14,
        zIndex: 10,
        alignSelf: 'center',
    },
    illustrationImage: {
        width: '80%',
        height: 275,
        marginTop: 65,
        alignSelf: 'center',
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 16,
        paddingBottom: 20,
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
        fontFamily: 'Lato-Bold',
        letterSpacing: -0.3,
    },
    rejectedTitle: {
        color: '#DC2626',
    },
    description: {
        fontSize: 14.5,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: 'Lato-Regular',
        paddingHorizontal: 8,
    },
    bottomBar: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 38 : 28,
        backgroundColor: '#FFFFFF',
    },
    completeButton: {
        backgroundColor: '#4A43EC',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4A43EC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Lato-Bold',
    },
    rejectedButton: {
        backgroundColor: '#DC2626',
        shadowColor: '#DC2626',
    },
    disabledButton: {
        opacity: 0.85,
    },
});

export default KycModal;
