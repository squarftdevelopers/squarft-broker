import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.31.27:3001';
const SEEN_IDS_KEY = 'seen_notification_ids';

const getSeenIds = async () => {
    try {
        const raw = await AsyncStorage.getItem(SEEN_IDS_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
};

const saveSeenIds = async (ids) => {
    try {
        const existing = await getSeenIds();
        ids.forEach((id) => {
            if (id != null) existing.add(String(id));
        });
        await AsyncStorage.setItem(SEEN_IDS_KEY, JSON.stringify(Array.from(existing)));
    } catch (e) {
        console.warn('[NotificationSlice] Failed to save seen IDs:', e);
    }
};

const formatNotificationTime = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);

        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return String(dateStr);
    }
};

const parseMetadata = (metadata) => {
    if (!metadata || typeof metadata === 'object') return metadata || {};
    try {
        return JSON.parse(metadata);
    } catch {
        return {};
    }
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetch',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth?.token;
            if (!token) {
                return { items: [], seenIds: [] };
            }

            const response = await fetch(`${API_BASE_URL}/api/v1/broker/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);

            const seenIds = await getSeenIds();
            return {
                items: Array.isArray(data.data) ? data.data : [],
                seenIds: Array.from(seenIds),
            };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const markNotificationReadApi = createAsyncThunk(
    'notifications/markReadApi',
    async (id, { getState }) => {
        try {
            await saveSeenIds([id]);
            const token = getState().auth?.token;
            if (token && id) {
                await fetch(`${API_BASE_URL}/api/v1/broker/notifications/${id}/read`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            return id;
        } catch (_) {}
    }
);

export const markAllReadApi = createAsyncThunk(
    'notifications/markAllRead',
    async (_, { getState }) => {
        try {
            const state = getState();
            const list = state.notifications?.list || [];
            const ids = list.map((n) => n.id);
            if (ids.length > 0) {
                await saveSeenIds(ids);
            }
            const token = state.auth?.token;
            if (token) {
                await fetch(`${API_BASE_URL}/api/v1/broker/notifications/read-all`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch (_) {}
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        list: [],
        unreadCount: 0,
        loading: false,
    },
    reducers: {
        markAsWatched: (state, action) => {
            const id = action.payload;
            const n = state.list.find((item) => String(item.id) === String(id));
            if (n) {
                n.watched = true;
                n.is_read = true;
            }
            saveSeenIds([id]);
            state.unreadCount = state.list.filter((item) => !item.is_read && !item.watched).length;
        },
        markAllAsWatched: (state) => {
            const ids = state.list.map((item) => item.id);
            state.list.forEach((item) => {
                item.watched = true;
                item.is_read = true;
            });
            saveSeenIds(ids);
            state.unreadCount = 0;
        },
        addNotification: (state, action) => {
            state.list.unshift(action.payload);
            state.unreadCount = state.list.filter((item) => !item.is_read && !item.watched).length;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    const { items = [], seenIds = [] } = action.payload;
                    const seenSet = new Set(seenIds);

                    state.list = items.map((n) => {
                        const isSeen = Boolean(n.is_read) || seenSet.has(String(n.id));
                        return {
                            id: n.id,
                            title: n.title,
                            description: n.body,
                            type: n.type,
                            time: formatNotificationTime(n.sent_at),
                            watched: isSeen,
                            is_read: isSeen,
                            metadata: parseMetadata(n.metadata),
                        };
                    });
                    state.unreadCount = state.list.filter((n) => !n.is_read && !n.watched).length;
                }
            })
            .addCase(fetchNotifications.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const { markAsWatched, markAllAsWatched, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
