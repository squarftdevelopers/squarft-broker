import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.31.27:3001';

const parseListFilter = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map(String).map(item => item.trim().toLowerCase()).filter(Boolean);
    }

    return String(value)
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
};

const parseNumberFilter = (value) => {
    if (value === undefined || value === null || value === '') return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getPropertyCategory = (item) => normalizeText(item.type || item.category);

const getPropertySubtype = (item) => (
    normalizeText(item.sub_type || item.property_subtype || item.property_type || item.category)
);

const getBedroomFilterValue = (item) => {
    const kind = normalizeText(item.description || item.kind_of_property || item.bhk_type);
    if (kind.includes('bhk')) return kind;

    const bedrooms = Number(item.bedrooms);
    if (!Number.isFinite(bedrooms) || bedrooms <= 0) return '';

    return bedrooms >= 5 ? '5_plus_bhk' : `${bedrooms}_bhk`;
};

const getComparablePrice = (item) => {
    const value = item.base_price || item.min_price || item.price_from || item.max_price || item.price_to;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const matchesSearch = (item, search) => {
    if (!search) return true;

    return [
        item.name,
        item.title,
        item.property_name,
        item.city,
        item.area,
        item.address,
        item.location,
    ].some(value => normalizeText(value).includes(search));
};

const matchesStatusFilter = (item, status) => {
    const statusValue = normalizeText(status);
    if (!statusValue) return true;

    const aliases = {
        approved: ["approved", "published", "live", "active"],
        pending_review: ["pending_review", "pending", "under_review", "in_review"],
        rejected: ["rejected"],
        draft: ["draft"],
        published: ["published", "live", "active"],
        archived: ["archived"],
    };

    const values = aliases[statusValue] || [statusValue];
    return values.some(value => normalizeText(item.status || item.approval_status || item.listing_status) === value);
};

const applyMyAddedFilters = (items, filters = {}) => {
    const category = normalizeText(filters.category);
    const propertyTypes = parseListFilter(filters.property_type);
    const bhkTypes = parseListFilter(filters.bhk_type);
    const minPrice = parseNumberFilter(filters.min_price);
    const maxPrice = parseNumberFilter(filters.max_price);
    const status = normalizeText(filters.status);
    const search = normalizeText(filters.search);

    return items.filter((item) => {
        if (category && getPropertyCategory(item) !== category) return false;
        if (propertyTypes.length > 0 && !propertyTypes.includes(getPropertySubtype(item))) return false;
        if (bhkTypes.length > 0 && !bhkTypes.includes(getBedroomFilterValue(item))) return false;
        if (status && !matchesStatusFilter(item, status)) return false;
        if (!matchesSearch(item, search)) return false;

        if (minPrice !== null || maxPrice !== null) {
            const price = getComparablePrice(item);
            if (price === null) return false;
            if (minPrice !== null && price < minPrice) return false;
            if (maxPrice !== null && price > maxPrice) return false;
        }

        return true;
    });
};

// Fetch broker's added PROPERTIES and PROJECTS with optional filters
// Backend endpoint /api/v1/broker/properties now returns BOTH properties and projects
// Each item has an 'item_type' field: 'property' or 'project'
// Supports query parameters: category, property_type, bhk_type, min_price, max_price, search
export const fetchMyAddedProperties = createAsyncThunk(
    'myAdded/fetchProperties',
    async (filters = {}, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const hasFilters = Object.values(filters || {}).some(value => String(value || '').trim() !== '');
            const query = new URLSearchParams();
            Object.entries(filters || {}).forEach(([key, value]) => {
                if (value !== undefined && value !== null && String(value).trim() !== '') query.set(key, String(value));
            });
            const url = `${API_BASE_URL}/api/v1/broker/properties${query.toString() ? `?${query.toString()}` : ''}`;
            
            // Single endpoint returns both properties (created via new form) and projects
            // Properties: filtered by created_by = brokerId
            // Projects: filtered by broker_id = brokerId
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            
            if (!response.ok) return rejectWithValue(data.message || 'Failed to fetch properties');
            
            // Backend returns { data: [...items with item_type field...] }
            const items = data.data || [];
            return hasFilters ? applyMyAddedFilters(items, filters) : items;
        } catch (err) {
            console.error('❌ [fetchMyAddedProperties] Error:', err);
            return rejectWithValue(err.message);
        }
    }
);

// Update property (for properties table)
export const updateProperty = createAsyncThunk(
    'myAdded/updateProperty',
    async ({ propertyId, propertyData }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/properties/${propertyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(propertyData),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return { propertyId, propertyData };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Update project (for projects table)
export const updateProject = createAsyncThunk(
    'myAdded/updateProject',
    async ({ projectId, projectData }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(projectData),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return { projectId, projectData };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Delete property (for properties table)
export const deleteProperty = createAsyncThunk(
    'myAdded/deleteProperty',
    async (propertyId, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/properties/${propertyId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return propertyId;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Delete project (for projects table)
export const deleteProject = createAsyncThunk(
    'myAdded/deleteProject',
    async (projectId, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return projectId;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Get single property details for editing
export const fetchPropertyDetails = createAsyncThunk(
    'myAdded/fetchPropertyDetails',
    async (propertyId, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            console.log('🔍 [fetchPropertyDetails] Fetching property ID:', propertyId);
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/properties/${propertyId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            console.log('🔍 [fetchPropertyDetails] Response:', JSON.stringify(data, null, 2));
            if (!response.ok) return rejectWithValue(data.message || 'Failed to fetch property details');
            
            // Backend returns { success: true, data: {...} }
            return data.data;
        } catch (err) {
            console.error('❌ [fetchPropertyDetails] Error:', err);
            return rejectWithValue(err.message);
        }
    }
);

// Get single project details for editing
export const fetchProjectDetails = createAsyncThunk(
    'myAdded/fetchProjectDetails',
    async (projectId, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            console.log('🔍 [fetchProjectDetails] Fetching project ID:', projectId);
            const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            console.log('🔍 [fetchProjectDetails] Response:', JSON.stringify(data, null, 2));
            if (!response.ok) return rejectWithValue(data.message);
            return data.data;
        } catch (err) {
            console.error('❌ [fetchProjectDetails] Error:', err);
            return rejectWithValue(err.message);
        }
    }
);

const myAddedSlice = createSlice({
    name: 'myAdded',
    initialState: {
        list: [],
        loading: false,
        error: null,
        currentItem: null,
        currentItemLoading: false,
    },
    reducers: {
        addProperty: (state, action) => {
            state.list.unshift({
                id: state.list.length + 1,
                ...action.payload,
            });
        },
        removeProperty: (state, action) => {
            state.list = state.list.filter(item => item.id !== action.payload);
        },
        updatePropertyStatus: (state, action) => {
            const item = state.list.find(p => p.id === action.payload.id);
            if (item) item.status = action.payload.status;
        },
        clearCurrentItem: (state) => {
            state.currentItem = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyAddedProperties.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyAddedProperties.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchMyAddedProperties.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch property details
            .addCase(fetchPropertyDetails.pending, (state) => {
                state.currentItemLoading = true;
                state.error = null;
            })
            .addCase(fetchPropertyDetails.fulfilled, (state, action) => {
                state.currentItemLoading = false;
                state.currentItem = action.payload;
                console.log('✅ [myAddedSlice] Property details loaded into currentItem:', JSON.stringify(action.payload, null, 2));
            })
            .addCase(fetchPropertyDetails.rejected, (state, action) => {
                state.currentItemLoading = false;
                state.error = action.payload;
            })
            // Fetch project details
            .addCase(fetchProjectDetails.pending, (state) => {
                state.currentItemLoading = true;
                state.error = null;
            })
            .addCase(fetchProjectDetails.fulfilled, (state, action) => {
                state.currentItemLoading = false;
                state.currentItem = action.payload;
                console.log('✅ [myAddedSlice] Project details loaded into currentItem:', JSON.stringify(action.payload, null, 2));
            })
            .addCase(fetchProjectDetails.rejected, (state, action) => {
                state.currentItemLoading = false;
                state.error = action.payload;
            })
            // Update property
            .addCase(updateProperty.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProperty.fulfilled, (state, action) => {
                state.loading = false;
                const { propertyId, propertyData } = action.payload;
                const index = state.list.findIndex(p => p.id === propertyId);
                if (index !== -1) {
                    state.list[index] = { ...state.list[index], ...propertyData };
                }
            })
            .addCase(updateProperty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update project
            .addCase(updateProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                state.loading = false;
                const { projectId, projectData } = action.payload;
                const index = state.list.findIndex(p => p.id === projectId);
                if (index !== -1) {
                    state.list[index] = { ...state.list[index], ...projectData };
                }
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete property
            .addCase(deleteProperty.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProperty.fulfilled, (state, action) => {
                state.loading = false;
                state.list = state.list.filter(p => p.id !== action.payload);
            })
            .addCase(deleteProperty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete project
            .addCase(deleteProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.loading = false;
                state.list = state.list.filter(p => p.id !== action.payload);
            })
            .addCase(deleteProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { addProperty, removeProperty, updatePropertyStatus, clearCurrentItem } = myAddedSlice.actions;
export default myAddedSlice.reducer;
