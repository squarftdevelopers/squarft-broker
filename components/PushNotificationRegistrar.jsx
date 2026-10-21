import { useNotificationResponse } from "../services/useNotificationResponse";
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
    useNotificationResponse((response) => {
        router.push(resolveNotificationRoute(response.notification.request.content.data || {}));
    });

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
        dispatch(fetchNotifications());

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
    }, [dispatch, isLoggedIn, token]);

    useEffect(() => {
        if (!isLoggedIn || !token) return undefined;
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') dispatch(fetchNotifications());
        });
        return () => subscription.remove();
    }, [dispatch, isLoggedIn, token]);

    useEffect(() => {
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

        return () => {
            receivedSubscription.remove();
        };
    }, [dispatch, router]);

    return null;
}
