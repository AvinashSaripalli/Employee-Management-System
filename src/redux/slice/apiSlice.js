import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/admin/',
    credentials: 'include'
  }),

  endpoints: (builder) => ({

    dropdowns: builder.query({
      query: () => 'dropdowns',
    }),

    registerUser: builder.mutation({
      query: (payload) => ({
        url: 'register',
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),

    login: builder.mutation({
      query: (payload) => ({
        url: 'login',
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),


  }),
});

export const {
  useDropdownsQuery,
  useRegisterUserMutation,
  useLoginMutation
} = apiSlice;
