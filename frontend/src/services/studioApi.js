import { baseApi } from './baseApi';

export const studioApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPortfolio: builder.query({
      query: (params = {}) => ({ url: '/portfolio', params }),
      providesTags: ['Portfolio'],
    }),
    getPortfolioStyles: builder.query({
      query: () => '/portfolio/styles',
    }),
    getAdminPortfolio: builder.query({
      query: () => '/portfolio/admin/all',
      providesTags: ['Portfolio'],
    }),
    createPortfolioItem: builder.mutation({
      query: (body) => ({ url: '/portfolio', method: 'POST', body }),
      invalidatesTags: ['Portfolio'],
    }),
    updatePortfolioItem: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/portfolio/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Portfolio'],
    }),
    deletePortfolioItem: builder.mutation({
      query: (id) => ({ url: `/portfolio/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Portfolio'],
    }),

    getArtists: builder.query({
      query: (params = {}) => ({ url: '/artists', params }),
      providesTags: ['Artists'],
    }),
    getArtist: builder.query({
      query: (id) => `/artists/${id}`,
      providesTags: ['Artists'],
    }),
    getArtistAvailability: builder.query({
      query: ({ id, from, to }) => ({
        url: `/artists/${id}/availability`,
        params: { from, to },
      }),
    }),
    createArtist: builder.mutation({
      query: (body) => ({ url: '/artists', method: 'POST', body }),
      invalidatesTags: ['Artists'],
    }),
    updateArtist: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/artists/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Artists'],
    }),
    deleteArtist: builder.mutation({
      query: (id) => ({ url: `/artists/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Artists'],
    }),

    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),

    createAppointment: builder.mutation({
      query: (body) => ({ url: '/appointments', method: 'POST', body }),
      invalidatesTags: ['Appointments'],
    }),
    getMyAppointments: builder.query({
      query: (params = {}) => ({ url: '/appointments/mine', params }),
      providesTags: ['Appointments'],
    }),
    getAllAppointments: builder.query({
      query: (params = {}) => ({ url: '/appointments', params }),
      providesTags: ['Appointments'],
    }),
    updateAppointment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/appointments/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Appointments'],
    }),
    releaseAppointment: builder.mutation({
      query: (id) => ({ url: `/appointments/${id}/release`, method: 'POST' }),
      invalidatesTags: ['Appointments'],
    }),
    confirmAppointment: builder.mutation({
      query: (id) => ({ url: `/appointments/${id}/confirm`, method: 'POST' }),
      invalidatesTags: ['Appointments'],
    }),
  }),
});

export const {
  useGetPortfolioQuery,
  useGetPortfolioStylesQuery,
  useGetAdminPortfolioQuery,
  useCreatePortfolioItemMutation,
  useUpdatePortfolioItemMutation,
  useDeletePortfolioItemMutation,
  useGetArtistsQuery,
  useGetArtistQuery,
  useGetArtistAvailabilityQuery,
  useCreateArtistMutation,
  useUpdateArtistMutation,
  useDeleteArtistMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useCreateAppointmentMutation,
  useGetMyAppointmentsQuery,
  useGetAllAppointmentsQuery,
  useUpdateAppointmentMutation,
  useReleaseAppointmentMutation,
  useConfirmAppointmentMutation,
} = studioApi;
