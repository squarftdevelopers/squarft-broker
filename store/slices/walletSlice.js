import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.31.27:3001';

const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const normalizeTransaction = (transaction = {}) => {
    const rawType = transaction.type || transaction.transaction_type || '';
    const type = String(rawType).toLowerCase();
    const propertyName = transaction.property_name || transaction.propertyName || transaction.title || '';
    const propertyAddress = transaction.property_address || transaction.propertyAddress || transaction.location || '';
    const transferToDetails = transaction.transfer_to_details || transaction.transferToDetails || transaction.bank_name || transaction.bank || '';
    const createdAt = transaction.created_at || transaction.createdAt || transaction.date || null;
    const utr = transaction.utr || transaction.transactionId || null;
    const transactionNo = utr || transaction.transactionNo || transaction.transaction_no || transaction.id?.toString() || '';

    const defaultTitle = type === 'debit' ? 'Bank Withdrawal' : 'Commission Earned';
    const defaultLocation = type === 'debit' ? (transferToDetails || 'Transferred to bank account') : (propertyAddress || 'Earned from property deal');

    return {
        ...transaction,
        amount: toNumber(transaction.amount),
        type,
        utr,
        property_name: propertyName || defaultTitle,
        propertyName: propertyName || defaultTitle,
        property_address: propertyAddress,
        propertyAddress,
        transfer_to_details: transferToDetails,
        transferToDetails,
        bank_name: transferToDetails,
        bank: transferToDetails || (type === 'debit' ? 'Bank Account' : 'N/A'),
        created_at: createdAt,
        createdAt,
        title: propertyName || defaultTitle,
        location: defaultLocation,
        transactionNo,
    };
};

const normalizeTransactionList = (transactions = []) =>
    Array.isArray(transactions) ? transactions.map(normalizeTransaction) : [];

const normalizeOverview = (overview = {}) => ({
    balance: toNumber(overview.balance ?? overview.mainBalance ?? overview.main_balance),
    totalEarned: toNumber(overview.totalEarned ?? overview.total_earned),
    totalWithdrawn: toNumber(overview.totalWithdrawn ?? overview.total_withdrawn),
    recentTransactions: normalizeTransactionList(overview.recentTransactions ?? overview.recent_transactions),
});

const normalizeTransactionPayload = (payload = {}) => ({
    count: toNumber(payload.count),
    page: toNumber(payload.page, 1),
    transactions: normalizeTransactionList(payload.transactions),
});

const normalizeBankAccount = (account = {}) => ({
    ...account,
    bankName: account.bankName || account.bank_name || '',
    accountNumberMasked: account.accountNumberMasked || account.account_number_masked || '',
    ifscCode: account.ifscCode || account.ifsc_code || '',
    isDefault: Boolean(account.isDefault ?? account.is_default),
});

const normalizeBankAccounts = (accounts) => {
    if (!accounts) return [];
    return (Array.isArray(accounts) ? accounts : [accounts]).map(normalizeBankAccount);
};

// Async Thunks
export const fetchWalletOverview = createAsyncThunk(
    'wallet/fetchWalletOverview',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/broker-sales/wallet`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return normalizeOverview(data.data);
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchTransactions = createAsyncThunk(
    'wallet/fetchTransactions',
    async ({ page = 1, limit = 10 } = {}, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/broker-sales/wallet?page=${page}&limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return normalizeTransactionPayload(data.data);
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchCommissionHistory = createAsyncThunk(
    'wallet/fetchCommissionHistory',
    async ({ page = 1, limit = 10 } = {}, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            console.log('💰 [walletSlice] Fetching commission history with token:', token ? 'present' : 'missing');
            
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });
            // FIX: Changed from commissionHistory to commission-history (matches backend route)
            const url = `${API_BASE_URL}/api/v1/broker/wallet/commission-history?${params.toString()}`;
            console.log('💰 [walletSlice] Request URL:', url);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            console.log('💰 [walletSlice] Response status:', response.status);
            
            const data = await response.json();
            console.log('💰 [walletSlice] Response data:', JSON.stringify(data, null, 2));
            
            if (!response.ok) return rejectWithValue(data.message || 'Failed to fetch commission history');
            
            // FIX: Backend now returns data.commissions directly (not data.transactions)
            const normalized = {
                count: data.data?.pagination?.total || 0,
                page: data.data?.pagination?.page || 1,
                commissions: Array.isArray(data.data?.commissions) 
                    ? data.data.commissions.map(commission => ({
                        ...commission,
                        amount: Number(commission.commissionAmount || 0),
                        propertyName: commission.propertyName || '',
                        property_name: commission.propertyName || '',
                        propertyAddress: commission.propertyAddress || '',
                        property_address: commission.propertyAddress || '',
                        commissionKind: commission.commissionKind || null,
                        createdAt: commission.date || null,
                        created_at: commission.date || null,
                        type: 'credit',
                        // Backend returns "Paid" or "Pending", keep as is
                        status: commission.status || 'Pending',
                    }))
                    : [],
            };
            console.log('💰 [walletSlice] Normalized data:', JSON.stringify(normalized, null, 2));
            
            return normalized;
        } catch (err) {
            console.error('❌ [walletSlice] Error fetching commission history:', err);
            return rejectWithValue(err.message);
        }
    }
);

export const fetchBankAccounts = createAsyncThunk(
    'wallet/fetchBankAccounts',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/bank-account`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return normalizeBankAccounts(data.data);
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const addBankAccountApi = createAsyncThunk(
    'wallet/addBankAccountApi',
    async (bankData, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/bank-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bankData),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return normalizeBankAccount(data.data);
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const requestWithdrawalApi = createAsyncThunk(
    'wallet/requestWithdrawalApi',
    async ({ amount, notes = null }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/withdrawal/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ amount, notes }),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const walletSlice = createSlice({
    name: 'wallet',
    initialState: {
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        bankAccounts: [],
        transactions: [],
        commissions: [],
        loading: false,
        error: null,
        transactionCount: 0,
        commissionCount: 0,
        currentPage: 1,
        currentCommissionPage: 1,
    },
    reducers: {
        clearWalletError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Overview
            .addCase(fetchWalletOverview.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWalletOverview.fulfilled, (state, action) => {
                state.loading = false;
                state.balance = action.payload.balance;
                state.totalEarned = action.payload.totalEarned;
                state.totalWithdrawn = action.payload.totalWithdrawn;
                if (action.payload.recentTransactions.length > 0 && state.transactions.length === 0) {
                    state.transactions = action.payload.recentTransactions;
                }
            })
            .addCase(fetchWalletOverview.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Transactions
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.transactions = action.payload.transactions;
                state.transactionCount = action.payload.count;
                state.currentPage = action.payload.page;
            })
            // Banks
            .addCase(fetchBankAccounts.fulfilled, (state, action) => {
                state.bankAccounts = action.payload;
            })
            // Add Bank
            .addCase(addBankAccountApi.fulfilled, (state, action) => {
                state.bankAccounts.push(action.payload);
            })
            // Withdrawal
            .addCase(requestWithdrawalApi.rejected, (state, action) => {
                state.error = action.payload;
            })
            // Commission History
            .addCase(fetchCommissionHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCommissionHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.commissions = action.payload.commissions;
                state.commissionCount = action.payload.count;
                state.currentCommissionPage = action.payload.page;
            })
            .addCase(fetchCommissionHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearWalletError } = walletSlice.actions;
export default walletSlice.reducer;
