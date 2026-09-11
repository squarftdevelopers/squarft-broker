import api from './projectApi';

const normalizeError = (error, fallback) => ({
  message: error.response?.data?.message || error.message || fallback,
  status: error.response?.status,
  details: error.response?.data,
});

const parseMilestoneAmount = (item) => {
  const raw = item?.amount ?? item?.milestone_amount ?? item?.total_amount ?? item?.totalAmount ?? 0;
  const parsed = Number(String(raw).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeDealSummaryPayload = (data = {}) => {
  const payload = { ...data };

  if (Array.isArray(payload.payment_schedule)) {
    payload.payment_schedule = payload.payment_schedule.filter((item) => parseMilestoneAmount(item) > 0);
  }

  return payload;
};

export const inventoryService = {
  // GET /api/project-developer/projects/:projectId/inventory
  // Pass type to fetch a single tab, omit for all seven tabs
  getProjectInventory: async (projectId, type = null) => {
    try {
      const url = type
        ? `/api/project-developer/projects/${projectId}/inventory?type=${type}`
        : `/api/project-developer/projects/${projectId}/inventory`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to fetch inventory');
    }
  },

  // PATCH /api/project-developer/inventory-units/:unitId
  updateInventoryUnit: async (unitId, data) => {
    try {
      const response = await api.patch(`/api/project-developer/inventory-units/${unitId}`, data);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to update inventory unit');
    }
  },

  // GET /api/project-developer/inventory-units/:unitId/details
  getInventoryUnitDetails: async (unitId) => {
    try {
      const response = await api.get(`/api/project-developer/inventory-units/${unitId}/details`);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to fetch unit details');
    }
  },

  // PATCH /api/project-developer/projects/:projectId/summary
  updateProjectSummary: async (projectId, data) => {
    try {
      const response = await api.patch(`/api/project-developer/projects/${projectId}/summary`, data);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to update project summary');
    }
  },

  // POST /api/project-developer/inventory-units/:unitId/deal-summary
  createDealSummary: async (unitId, data) => {
    try {
      const response = await api.post(`/api/project-developer/inventory-units/${unitId}/deal-summary`, sanitizeDealSummaryPayload(data));
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to create deal summary');
    }
  },

  // PUT /api/project-developer/inventory-units/:unitId/deal-summary
  updateDealSummary: async (unitId, data) => {
    try {
      const response = await api.put(`/api/project-developer/inventory-units/${unitId}/deal-summary`, sanitizeDealSummaryPayload(data));
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to update deal summary');
    }
  },

  // GET /api/project-developer/inventory-deals/:dealId/payment-schedule
  getPaymentSchedule: async (dealId) => {
    try {
      const response = await api.get(`/api/project-developer/inventory-deals/${dealId}/payment-schedule`);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to fetch payment schedule');
    }
  },

  // PUT /api/project-developer/inventory-deals/:dealId/payment-schedule
  replacePaymentSchedule: async (dealId, milestones) => {
    try {
      const response = await api.put(`/api/project-developer/inventory-deals/${dealId}/payment-schedule`, { milestones });
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to replace payment schedule');
    }
  },

  // POST /api/project-developer/inventory-deals/:dealId/milestones
  createMilestone: async (dealId, data) => {
    try {
      const response = await api.post(`/api/project-developer/inventory-deals/${dealId}/milestones`, data);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to create milestone');
    }
  },

  // PUT /api/project-developer/inventory-deal-milestones/:milestoneId
  updateMilestone: async (milestoneId, data) => {
    try {
      const response = await api.put(`/api/project-developer/inventory-deal-milestones/${milestoneId}`, data);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to update milestone');
    }
  },

  // POST /api/project-developer/inventory-deal-milestones/:milestoneId/collect
  collectMilestonePayment: async (milestoneId, data) => {
    try {
      const response = await api.post(`/api/project-developer/inventory-deal-milestones/${milestoneId}/collect`, data);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to collect milestone payment');
    }
  },
};
