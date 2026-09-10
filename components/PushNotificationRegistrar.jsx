import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addNotification, fetchNotifications } from '../store/slices/notificationSlice';
import { resolveNotificationRoute } from '../utils/notificationRoutes';
import { registerBrokerPushNotifications } from '../utils/pushNotifications';

export default function PushNotificationRegistrar() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isLoggedIn, token } = useSelector((state) => ({
        isLoggedIn: state.auth.isLoggedIn,
        token: state.auth.token,
    }), shallowEqual);
    const lastAttemptedTokenRef = useRef(null);
    const lastHandledResponseRef = useRef(null);

    useEffect(() => {
        console.log('[PushNotificationRegistrar] Auth state changed', {
            isLoggedIn,
            hasAuthToken: Boolean(token),
        });

        if (!isLoggedIn || !token) {
            lastAttemptedTokenRef.current = null;
            return;
        }

        if (lastAttemptedTokenRef.current === token) {
            console.log('[PushNotificationRegistrar] Registration flow skipped', {
                reason: 'Already attempted for current auth token',
            });
            return;
        }

        let isActive = true;
        lastAttemptedTokenRef.current = token;

        const runRegistration = async () => {
            try {
                await registerBrokerPushNotifications({ authToken: token });
                if (isActive) {
                    console.log('[PushNotificationRegistrar] Registration flow completed', {
                        status: 'completed',
                    });
                }
            } catch (err) {
                if (isActive) {
                    console.log('[PushNotificationRegistrar] Registration flow completed', {
                        status: 'failed',
                        message: err?.message || String(err),
                    });
                }
            }
        };

        runRegistration();

        return () => {
            isActive = false;
        };
    }, [isLoggedIn, token]);

    useEffect(() => {
        const handleNotificationTap = (response) => {
            const data = response?.notification?.request?.content?.data || {};
            const responseId = response?.notification?.request?.identifier;
            if (responseId && lastHandledResponseRef.current === responseId) return;
            lastHandledResponseRef.current = responseId;
            const route = resolveNotificationRoute(data);

            console.log('[PushNotificationRegistrar] Notification tapped', {
                eventType: data.eventType,
                action: data.action,
                route,
            });

            router.push(route);
        };

        const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
            const content = notification?.request?.content || {};
            const data = content.data || {};

            if (data.source === 'local') {
                dispatch(addNotification({
                    id: `${data.eventType || 'local'}-${data.timestamp || Date.now()}`,
                    title: content.title,
                    description: content.body,
                    type: data.type || 'success',
                    time: data.timestamp || new Date().toISOString(),
                    watched: false,
                    is_read: false,
                    metadata: data,
                }));
                return;
            }

            dispatch(fetchNotifications());
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationTap);

        // 🔧 FIX: Don't handle last notification response on app reload
        // This was causing notification routes to flash before splash screen
        // Only active tap gestures should trigger navigation
        // Notifications.getLastNotificationResponseAsync()
        //     .then((response) => {
        //         if (response) handleNotificationTap(response);
        //     })
        //     .catch((err) => {
        //         console.log('[PushNotificationRegistrar] Last notification response unavailable', {
        //             message: err?.message || String(err),
        //         });
        //     });

        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    }, [dispatch, router]);

    return null;
}
