"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Building,
  Bed,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user: {
    name?: string | null;
    role: "superadmin" | "admin";
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["superadmin", "admin"],
    },
    {
      name: "Rooms",
      href: "/dashboard/rooms",
      icon: Bed,
      roles: ["superadmin", "admin"],
    },
    {
      name: "Residents",
      href: "/dashboard/residents",
      icon: Users,
      roles: ["superadmin", "admin"],
    },
    {
      name: "Payments",
      href: "/dashboard/payments",
      icon: CreditCard,
      roles: ["superadmin", "admin"],
    },
    {
      name: "Admin Management",
      href: "/dashboard/admin-management",
      icon: ShieldCheck,
      roles: ["superadmin"],
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["superadmin", "admin"],
    },
  ];

  return (
    <div className="w-64 bg-card border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100">
        <div className="bg-primary rounded-lg p-2">
          <Building className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">
          WESTIN HostleHub
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          // Hide items the user doesn't have permission for
          if (!item.roles.includes(user.role)) return null;

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-white font-medium shadow-md shadow-primary/20"
                  : "text-secondary hover:bg-surface hover:text-slate-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-surface/50">
        <div className="px-4 py-2 mb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Logged in as
          </p>
          <p className="text-sm font-medium text-slate-900 truncate">
            {user.name || "User"}
          </p>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-secondary uppercase mt-1">
            {user.role}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
