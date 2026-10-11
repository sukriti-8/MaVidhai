"use client";

import { useCallback, useEffect, useState } from "react";
import { get, patch } from "@/lib/api";

const ROLES = ["CUSTOMER", "SUB_ADMIN", "SUPER_ADMIN"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await get("/api/admin/users?page=1&limit=100");
      setUsers(result.items || []);
    } catch (err) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const changeRole = async (user, role) => {
    if (role === user.role) return;
    setSavingId(user.id);
    setError("");
    try {
      const updated = await patch(`/api/admin/users/${user.id}/role`, { role });
      setUsers((current) => current.map((item) => item.id === user.id ? updated : item));
    } catch (err) {
      setError(err.message || "Unable to change this user's role.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">User Access</h1>
          <p className="mt-1 text-sm text-stone-600">Assign store operations access to trusted team members.</p>
        </div>
        <button type="button" onClick={loadUsers} className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800">Refresh</button>
      </div>

      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Sub-Admins can manage products, categories, inventory, and orders. User and role management stays with Super Admins.
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? <tr><td className="px-5 py-8 text-center text-stone-500" colSpan={4}>Loading users…</td></tr> : users.length === 0 ? <tr><td className="px-5 py-8 text-center text-stone-500" colSpan={4}>No users found.</td></tr> : users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-4 font-medium text-stone-900">{user.full_name}</td>
                <td className="px-5 py-4 text-stone-600">{user.email}</td>
                <td className="px-5 py-4">
                  <select aria-label={`Role for ${user.email}`} value={user.role} disabled={savingId === user.id} onChange={(event) => changeRole(user, event.target.value)} className="rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm disabled:opacity-60">
                    {ROLES.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}
                  </select>
                </td>
                <td className="px-5 py-4"><span className={user.is_active ? "text-green-700" : "text-stone-500"}>{user.is_active ? "Active" : "Inactive"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
