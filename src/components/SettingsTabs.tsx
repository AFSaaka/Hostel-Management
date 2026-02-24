"use client";

import { useState, useEffect } from "react";
import {
  User,
  Shield,
  Settings as Gear,
  Save,
  Loader2,
  KeyRound,
  Download,
  AlertOctagon,
  Users,
  History,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { exportTableToCSV } from "@/app/actions/export";
import {
  updateProfile,
  updatePassword,
  toggleMaintenanceMode,
  updateSystemIdentity,
  getAuditLogs,
  updateAdminRole,
} from "@/app/actions/settings";

interface SettingsTabsProps {
  profile: {
    fullName: string | null;
    role: string;
  };
  isSuperadmin: boolean;
  systemSettings: {
    hostelName: string;
    logoUrl: string | null;
    isMaintenanceMode: number;
  };
}

export default function SettingsTabs({
  profile,
  isSuperadmin,
  systemSettings,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [isDirOpen, setIsDirOpen] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(
    systemSettings?.isMaintenanceMode === 1,
  );

  // --- HANDLERS ---

  async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    toast.promise(updateProfile(formData), {
      loading: "Saving profile changes...",
      success: (res: any) => {
        if (!res.success) throw new Error(res.error);
        return "Profile updated successfully!";
      },
      error: (err) => err.message,
      finally: () => setLoading(false),
    });
  }

  async function handlePasswordUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pass = formData.get("password");
    const confirm = formData.get("confirmPassword");

    if (pass !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    toast.promise(updatePassword(formData), {
      loading: "Updating security credentials...",
      success: (res: any) => {
        if (!res.success) throw new Error(res.error);
        (e.target as HTMLFormElement).reset();
        return "Password changed successfully!";
      },
      error: (err) => err.message,
      finally: () => setLoading(false),
    });
  }

  async function handleIdentityUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    toast.promise(updateSystemIdentity(formData), {
      loading: "Updating hostel identity...",
      success: (res: any) => {
        if (!res.success) throw new Error(res.error);
        return "System identity updated!";
      },
      error: (err) => err.message,
      finally: () => setLoading(false),
    });
  }

  async function handleMaintenanceToggle() {
    setLoading(true);
    toast.promise(toggleMaintenanceMode(), {
      loading: "Processing system lockdown...",
      success: (res: any) => {
        if (!res.success) throw new Error(res.error);
        setIsMaintenance(res.enabled);
        return res.enabled
          ? "Maintenance Mode: Enabled"
          : "Maintenance Mode: Disabled";
      },
      error: (err) => err.message,
      finally: () => setLoading(false),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <TabBtn
          active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
          icon={<User className="w-4 h-4" />}
          label="Profile"
        />
        <TabBtn
          active={activeTab === "security"}
          onClick={() => setActiveTab("security")}
          icon={<Shield className="w-4 h-4" />}
          label="Security"
        />
        {isSuperadmin && (
          <TabBtn
            active={activeTab === "system"}
            onClick={() => setActiveTab("system")}
            icon={<Gear className="w-4 h-4" />}
            label="System"
          />
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 min-h-125">
        {activeTab === "profile" && (
          <form
            onSubmit={handleProfileUpdate}
            className="space-y-6 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup
                label="Full Name"
                name="fullName"
                defaultValue={profile.fullName ?? ""}
                placeholder="Enter your full name"
              />
              <InputGroup
                label="Role"
                name="role"
                defaultValue={profile.role}
                disabled
              />
            </div>
            <SaveButton loading={loading} />
          </form>
        )}

        {activeTab === "security" && (
          <form
            onSubmit={handlePasswordUpdate}
            className="space-y-6 animate-in fade-in slide-in-from-bottom-2 max-w-md"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-900 mb-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <KeyRound className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-bold">Update Password</h3>
              </div>
              <InputGroup
                label="New Password"
                name="password"
                type="password"
                required
              />
              <InputGroup
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
            <SaveButton loading={loading} label="Update Password" />
          </form>
        )}

        {activeTab === "system" && isSuperadmin && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
            <section className="space-y-4">
              <SectionHeader
                icon={<Gear className="w-4 h-4" />}
                title="Hostel Identity"
              />
              <form
                onSubmit={handleIdentityUpdate}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-4x1"
              >
                <InputGroup
                  label="Hostel Name"
                  name="hostelName"
                  defaultValue={systemSettings?.hostelName}
                />
                <div className="flex items-end pb-1">
                  <SaveButton loading={loading} label="Save Identity" />
                </div>
              </form>
            </section>

            <section
              className={`${
                isMaintenance
                  ? "bg-slate-900 border-slate-800"
                  : "bg-red-50 border-red-100"
              } border rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between transition-all duration-500 gap-6`}
            >
              <div className="max-w-md text-center md:text-left">
                <h3
                  className={`${
                    isMaintenance ? "text-white" : "text-red-900"
                  } font-black flex items-center justify-center md:justify-start gap-2 text-lg`}
                >
                  <AlertOctagon
                    className={`${
                      isMaintenance ? "text-red-500" : "text-red-600"
                    } w-6 h-6`}
                  />
                  System Lockdown
                </h3>
                <p
                  className={`${
                    isMaintenance ? "text-slate-400" : "text-red-700/70"
                  } text-xs mt-2 font-medium leading-relaxed`}
                >
                  {isMaintenance
                    ? "PROTECTION ACTIVE: Standard Admins are blocked. System is in read-only mode for everyone except Superadmins."
                    : "System is live. Activate lockdown for sensitive updates or financial audits."}
                </p>
              </div>
              <button
                onClick={handleMaintenanceToggle}
                disabled={loading}
                className={`${
                  isMaintenance
                    ? "bg-white text-slate-900"
                    : "bg-red-600 text-white shadow-lg shadow-red-200"
                } px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all min-w-45 flex items-center justify-center gap-2`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isMaintenance ? "Lift Lockdown" : "Activate Lockdown"}
              </button>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-8 border border-slate-100 rounded-[2.5rem] space-y-5">
                <SectionHeader
                  icon={<Download className="w-4 h-4" />}
                  title="Database Backup"
                />
                <div className="grid grid-cols-1 gap-2">
                  <ExportBtn label="Residents CSV" table="residents" />
                  <ExportBtn label="Payments Ledger (CSV)" table="payments" />
                  <ExportBtn label="Rooms List (CSV)" table="rooms" />
                </div>
              </div>

              <div className="p-8 border border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 group">
                <div className="flex -space-x-3 group-hover:space-x-1 transition-all">
                  <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100">
                    <History className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900">
                    Admin & Activity
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-55">
                    Audit system logs and manage administrative permissions.
                  </p>
                </div>
                <button
                  onClick={() => setIsDirOpen(true)}
                  className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 px-6 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  Open Directory
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdminDirectory isOpen={isDirOpen} onClose={() => setIsDirOpen(false)} />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function AdminDirectory({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Start false to prevent flash
  const [view, setView] = useState<"admins" | "logs">("admins");

  // 1. Move fetching into useEffect
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]); // Only triggers when the modal opens

  async function fetchData() {
    setLoading(true);
    try {
      // 2. Keep your Promise.all for performance
      const [logData, adminData] = await Promise.all([
        getAuditLogs(50),
        import("@/app/actions/settings").then((mod) => mod.getAllAdmins()),
      ]);
      setLogs(logData);
      setAdmins(adminData);
    } catch (e) {
      toast.error("Failed to sync directory data");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleToggle(targetId: string, currentRole: string) {
    const newRole = currentRole === "superadmin" ? "admin" : "superadmin";

    toast.promise(
      updateAdminRole(targetId, newRole as "admin" | "superadmin"),
      {
        loading: "Updating permissions...",
        success: () => {
          fetchData(); // 3. Re-fetch data after a change
          return `User updated to ${newRole}`;
        },
        error: (err) => err.message,
      },
    );
  }

  // 4. Removed the 'if (isOpen && loading...)' line entirely

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with Navigation */}
        <div className="p-8 border-b border-slate-100 bg-white space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                System Directory
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Manage permissions and audit system integrity.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setView("admins")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${view === "admins" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
            >
              Admin Management
            </button>
            <button
              onClick={() => setView("logs")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${view === "logs" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
            >
              Activity Logs
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="font-bold text-sm">Syncing with database...</p>
            </div>
          ) : view === "admins" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="p-6 border border-slate-100 rounded-3xl flex items-center justify-between hover:border-slate-300 transition-all bg-slate-50/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 font-black text-slate-400 shadow-sm">
                      {admin.fullName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">
                        {admin.fullName || "Unnamed Admin"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {admin.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        admin.role === "superadmin"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {admin.role}
                    </span>
                    <button
                      onClick={() => handleRoleToggle(admin.id, admin.role)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-900 underline underline-offset-4"
                    >
                      Change Role
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-slate-100 rounded-4x1 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4">Actor ID</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Entity</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-600 divide-y divide-slate-50">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {log.actorId.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                            log.action === "DELETE"
                              ? "bg-red-100 text-red-600"
                              : log.action === "CREATE"
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {log.entityType}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportBtn({
  label,
  table,
}: {
  label: string;
  table: "residents" | "payments" | "rooms";
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await exportTableToCSV(table);
      if (!res.success || !res.data) throw new Error(res.error);

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", res.filename || `${table}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${label} exported successfully`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all group disabled:opacity-50"
    >
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
      </div>
    </button>
  );
}

function TabBtn({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function SectionHeader({ icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
      <span className="text-slate-400">{icon}</span>
      <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">
        {title}
      </h3>
    </div>
  );
}

function InputGroup({ label, ...props }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-slate-900/5 transition-all disabled:opacity-40 font-medium"
      />
    </div>
  );
}

function SaveButton({ loading, label = "Save Changes" }: any) {
  return (
    <button
      disabled={loading}
      className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200 text-sm active:scale-95"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
