import { useDropdownsQuery } from '../redux/slice/apiSlice';

export const useDropdowns = () => {
  const { data, isLoading, error } = useDropdownsQuery();

  const dropdowns = data?.response || {
    company: [],
    bloodGroup: [],
    city: [],
    designation: [],
    gender: [],
    department: [],
  };

  return { dropdowns, isLoading, error };
};