import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  return url.replace(/\/+$/, '');
};

export const supportApi = {
  createTicket: async ({
    category,
    subject,
    message,
    referenceId,
    priority = 'normal',
    customerName,
    customerPhone,
  }) => {
    try {
      const token = await AsyncStorage.getItem('auth_token').catch(() => null);

      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/support/tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          appKey: 'squarft-broker',
          category,
          subject,
          message,
          referenceId: referenceId ? String(referenceId).trim() : undefined,
          priority,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg =
          data?.message ||
          (data?.errors && data.errors.map((e) => e.message).join(', ')) ||
          'Failed to submit support ticket';
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      if (error.message === 'Network request failed') {
        throw new Error(
          'Cannot connect to server. Please check your network connection and try again.'
        );
      }
      throw error;
    }
  },
};
