"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  X,
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  UserCog,
  LogOut,
  Plus,
  ClipboardList,
  CircleDollarSign,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Student Records", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/users", label: "User Management", icon: UserCog },
];

const registrarNavItems = [
  { href: "/registrar", label: "Dashboard", icon: LayoutDashboard },
  { href: "/registrar/enrollments", label: "Online Enrollment", icon: ClipboardList },
  { href: "/registrar/students", label: "Student Records", icon: Users },
  { href: "/registrar/payments", label: "Fee & Payment", icon: CircleDollarSign },
  { href: "/registrar/reports", label: "Reports", icon: FileText },
];

const parentNavItems = [
  { href: "/parent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/enrollment", label: "Online Enrollment", icon: ClipboardList },
  { href: "/parent/children", label: "Children", icon: Users },
  { href: "/parent/payments", label: "Fee & Payment", icon: CreditCard },
];

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-primary text-white",
  registrar: "bg-amber-500 text-white",
  parent: "bg-primary text-white",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role || "parent";
  const navItems =
    role === "admin"
      ? adminNavItems
      : role === "registrar"
      ? registrarNavItems
      : parentNavItems;

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#efeff1] text-slate-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[218px] overflow-hidden border-r border-black/10 bg-gradient-to-b from-[#8d1215] to-[#7a1114] text-white md:block">
        <div className="flex h-24 items-center px-5">
          <div>
            <p className="text-[35px] font-extrabold leading-none">CTK EnrollSys</p>
            <p className="mt-2 text-xs font-medium text-amber-300">● Paperless Enrollment</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-0 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mx-0 flex items-center gap-3 border-l-2 border-transparent px-5 py-3 text-base font-semibold text-white/95 transition-colors",
                  isActive
                    ? "border-l-amber-400 bg-[#a0161b]"
                    : "hover:bg-[#9f161c]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-amber-200/90">
          <p>Replaces physical filing cabinets</p>
          <p>All records digitally backed up</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-0 md:pl-[218px]">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/10 bg-[#f6f6f7] px-6">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-700">
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-none text-slate-900">{session?.user?.name || "User"}</p>
              <p className="mt-1 hidden text-xs text-slate-500 sm:block">{session?.user?.email || ""}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-400 bg-[#bf000f] text-xs font-bold text-white">
              {getInitials(session?.user?.name)}
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                roleBadgeStyles[role] || "bg-slate-600 text-white"
              )}
            >
              {role}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="h-9 w-9 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-5 md:p-6">{children}</main>
      </div>
    </div>
  );
}
