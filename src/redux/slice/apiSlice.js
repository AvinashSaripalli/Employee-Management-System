import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/api/admin/' }),
  endpoints: (builder) => ({
    // GET request
    dropdowns: builder.query({
      query: () => 'dropdowns',
    }),

    // POST request
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
  }),
});

export const { useDropdownsQuery, useRegisterUserMutation } = apiSlice;
