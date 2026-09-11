import api from './projectApi';

export const visitService = {
  // Get visit statistics for a project
  getVisitStats: async (projectId) => {
    try {
      console.log('🔵 [VISIT SERVICE] Fetching visit stats for project:', projectId);
      const response = await api.get(`/api/v1/projects/${projectId}/visits/stats`);
      console.log(' [VISIT SERVICE] Visit stats received:', response.data);
      return response.data;
    } catch (error) {
      console.log(' [VISIT SERVICE] Get visit stats error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch visit stats',
        status: error.response?.status,
        details: error.response?.data,
      };
    }
  },

  // Get upcoming visits for a project
  getUpcomingVisits: async (projectId, limit = 10) => {
    try {
      console.log('🔵 [VISIT SERVICE] Fetching upcoming visits for project:', projectId);
      const response = await api.get(`/api/v1/projects/${projectId}/visits/upcoming`, {
        params: { limit }
      });
      console.log(' [VISIT SERVICE] Upcoming visits received:', response.data);
      return response.data;
    } catch (error) {
      console.log(' [VISIT SERVICE] Get upcoming visits error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch upcoming visits',
        status: error.response?.status,
        details: error.response?.data,
      };
    }
  },

  // List all visits for a project with pagination and filtering
  listVisits: async (projectId, options = {}) => {
    try {
      const { status = 'all', page = 1, limit = 10 } = options;
      console.log('🔵 [VISIT SERVICE] Listing visits for project:', projectId, { status, page, limit });
      
      const response = await api.get(`/api/v1/projects/${projectId}/visits`, {
        params: { status, page, limit }
      });
      
      console.log(' [VISIT SERVICE] Visits list received:', response.data);
      return response.data;
    } catch (error) {
      console.log(' [VISIT SERVICE] List visits error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch visits',
        status: error.response?.status,
        details: error.response?.data,
      };
    }
  },
};
