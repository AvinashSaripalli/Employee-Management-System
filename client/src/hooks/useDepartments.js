import { useEffect, useState, useCallback, useMemo } from "react";
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

  // Flatten the department tree depth-first so selects can render
  // hierarchy (indentation). `depth` = nesting level (0 = top-level).
  const departmentOptions = useMemo(() => {
    const byParent = {};
    departments.forEach((d) => {
      const key = d.parentId || "root";
      (byParent[key] = byParent[key] || []).push(d);
    });

    const out = [];
    const reached = new Set();
    const walk = (parentKey, depth) => {
      (byParent[parentKey] || [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((d) => {
          reached.add(d.id);
          out.push({ id: d.id, name: d.name, depth, parentId: d.parentId || null, record: d });
          walk(d.id, depth + 1);
        });
    };

    walk("root", 0);

    // Any department whose parent no longer exists — show at top level so it never disappears
    departments
      .filter((d) => d.parentId && !reached.has(d.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((d) => out.push({ id: d.id, name: d.name, depth: 0, parentId: d.parentId || null, record: d }));

    return out;
  }, [departments]);

  return { departments, departmentNames, departmentOptions, loading, refresh: fetchDepartments };
}