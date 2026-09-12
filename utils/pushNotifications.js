import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { maskPushToken, registerPushToken } from '../services/notificationApi';

export const BROKER_ANDROID_CHANNEL_ID = Constants.expoConfig?.extra?.pushNotifications?.androidChannelId
    || 'broker_app_default';

const DEVICE_ID_STORAGE_KEY = 'squarft_broker_push_device_id';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const getStableDeviceId = async () => {
    const existingDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existingDeviceId) return existingDeviceId;

    const randomPart = Math.random().toString(36).slice(2, 12);
    const deviceId = `broker-${Date.now()}-${randomPart}`;
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    return deviceId;
};

const ensureAndroidNotificationChannel = async () => {
    if (Platform.OS !== 'android') return null;

    await Notifications.setNotificationChannelAsync(BROKER_ANDROID_CHANNEL_ID, {
        name: 'Broker notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A43EC',
    });

    if (BROKER_ANDROID_CHANNEL_ID !== 'broker-updates') {
        await Notifications.setNotificationChannelAsync('broker-updates', {
            name: 'Broker Updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4A43EC',
        });
    }

    console.log('[PushNotifications] Android notification channels ensured', {
        channelId: BROKER_ANDROID_CHANNEL_ID,
    });

    return BROKER_ANDROID_CHANNEL_ID;
};

const resolvePermissionStatus = async () => {
    const existingPermission = await Notifications.getPermissionsAsync();
    let finalPermission = existingPermission;

    if (existingPermission.status !== 'granted') {
        finalPermission = await Notifications.requestPermissionsAsync();
    }

    console.log('[PushNotifications] Permission status resolved', {
        status: finalPermission.status,
        granted: finalPermission.status === 'granted',
        canAskAgain: finalPermission.canAskAgain,
    });

    return finalPermission;
};

const resolveExpoProjectId = () => {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

    const source = Constants.expoConfig?.extra?.eas?.projectId
        ? 'expoConfig.extra.eas.projectId'
        : Constants.easConfig?.projectId
            ? 'Constants.easConfig.projectId'
            : 'missing';

    console.log('[PushNotifications] Expo project id resolved', {
        hasProjectId: Boolean(projectId),
        projectId: projectId ? projectId.substring(0, 8) + '...' : 'missing',
        source,
    });

    return projectId;
};

const resolveExpoPushToken = async (projectId) => {
    try {
        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
        const expoPushToken = tokenResponse.data;

        console.log('[PushNotifications] Expo push token resolved', {
            expoPushToken: maskPushToken(expoPushToken),
        });

        return expoPushToken;
    } catch (err) {
        const message = err?.message || String(err);
        const isExpoGo = Constants.executionEnvironment === 'storeClient'
            || message.toLowerCase().includes('expo go');

        console.log('[PushNotifications] Expo push token failed', {
            message,
            expoGoHint: isExpoGo
                ? 'Expo push tokens require a development build or production build for this project.'
                : undefined,
        });

        throw err;
    }
};

export const registerBrokerPushNotifications = async ({ authToken }) => {
    console.log('[PushNotifications] Registration started', {
        platform: Platform.OS,
        hasAuthToken: Boolean(authToken),
    });

    if (!authToken) {
        console.log('[PushNotifications] Registration skipped', {
            reason: 'Missing auth token',
        });
        return { skipped: true, reason: 'missing-auth-token' };
    }

    if (!['android', 'ios'].includes(Platform.OS)) {
        console.log('[PushNotifications] Registration skipped', {
            reason: 'Unsupported platform',
            platform: Platform.OS,
        });
        return { skipped: true, reason: 'unsupported-platform' };
    }

    await ensureAndroidNotificationChannel();

    const permission = await resolvePermissionStatus();
    if (permission.status !== 'granted') {
        console.log('[PushNotifications] Registration skipped', {
            reason: 'Notification permission denied',
            status: permission.status,
        });
        return { skipped: true, reason: 'permission-denied' };
    }

    const projectId = resolveExpoProjectId();
    if (!projectId) {
        console.log('[PushNotifications] Registration skipped', {
            reason: 'Expo project id missing',
        });
        return { skipped: true, reason: 'missing-project-id' };
    }

    const expoPushToken = await resolveExpoPushToken(projectId);
    const deviceId = await getStableDeviceId();

    const backendResult = await registerPushToken({
        authToken,
        expoPushToken,
        platform: Platform.OS,
        deviceId,
    });

    console.log('[PushNotifications] Backend registration completed', {
        status: backendResult.status,
        message: backendResult.message,
    });

    return {
        skipped: false,
        expoPushToken,
        backendResult,
    };
};
