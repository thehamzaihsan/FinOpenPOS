"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

interface ClientUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function SaaSUsersPage() {
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const supabase = createClient();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleClientStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? "suspend" : "activate";
    if (!confirm(`Are you sure you want to ${action} this client?`)) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;
      
      // Update local state
      setClients(clients.map(c => 
        c.id === userId ? { ...c, is_active: !currentStatus } : c
      ));
    } catch (err) {
      alert(`Failed to ${action} client: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.email.toLowerCase().includes(search.toLowerCase()) || 
                          (c.name && c.name.toLowerCase().includes(search.toLowerCase()));
    
    if (statusFilter === "active") return matchesSearch && c.is_active;
    if (statusFilter === "suspended") return matchesSearch && !c.is_active;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 font-medium">Loading POS-SY clients...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SaaS Client Management</h1>
          <p className="text-gray-600 mt-1">Control access for all POS-SY store owners</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
            <Users className="w-4 h-4" />
            {clients.length} Total Clients
          </div>
        </div>
      </div>

      <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-xl space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Client Info</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Role</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Registered</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{client.name || "Unnamed Store"}</p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                      {client.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {client.is_active ? (
                      <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600 font-bold text-sm">
                        <XCircle className="w-4 h-4" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleClientStatus(client.id, client.is_active)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ml-auto ${
                        client.is_active
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                      }`}
                    >
                      {client.is_active ? (
                        <><ShieldAlert className="w-4 h-4" /> Suspend Client</>
                      ) : (
                        <><ShieldCheck className="w-4 h-4" /> Activate Client</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No clients found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
