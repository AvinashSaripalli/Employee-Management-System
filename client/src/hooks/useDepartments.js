import { useEffect, useState, useCallback } from "react";
import axios from "../api/axios";

export default function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyName = localStorage.getItem("companyName") || "";

  const fetchDepartments = useCallback(async () => {
    if (!companyName) return;
    setLoading(true);
    try {
      const res = await axios.get("/departments", { params: { companyName } });
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch departments", e);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [companyName]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const departmentNames = departments.map((d) => d.name).filter(Boolean);

  return { departments, departmentNames, loading, refresh: fetchDepartments };
}
