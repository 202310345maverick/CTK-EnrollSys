"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  UserCog,
  LogOut,
  ClipboardList,
  Banknote,
  ChevronDown,
  Calendar,
  Settings,
  Menu,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/shared/notification-bell";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Student Records", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/users", label: "User Management", icon: UserCog },
  { href: "/admin/school-years", label: "School Years", icon: Calendar },
  { href: "/admin/fee-structures", label: "Fee Structures", icon: CreditCard },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const registrarNavItems = [
  { href: "/registrar", label: "Dashboard", icon: LayoutDashboard },
  { href: "/registrar/enrollments", label: "Online Enrollment", icon: ClipboardList },
  { href: "/registrar/students", label: "Student Records", icon: Users },
  { href: "/registrar/payments", label: "Fee & Payment", icon: Banknote },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[218px] overflow-hidden border-r border-black/10 bg-gradient-to-b from-[#8d1215] to-[#7a1114] text-white md:block">
        <div className="flex h-24 items-center gap-3 px-5">
          <Image src="/images/ctk.png" alt="CTK Logo" width={50} height={50} className="h-12 w-12 rounded-full bg-white object-contain p-1" />
          <div>
            <p className="text-2xl font-extrabold leading-none">CTK EnrollSys</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-0 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDashboardRoot = navItems[0].href === item.href;
            const isActive = isDashboardRoot
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
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
      </aside>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Nav Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] overflow-hidden bg-gradient-to-b from-[#8d1215] to-[#7a1114] text-white transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-3">
            <Image src="/images/ctk.png" alt="CTK Logo" width={40} height={40} className="h-10 w-10 rounded-full bg-white object-contain p-1" />
            <p className="text-lg font-extrabold leading-none">CTK EnrollSys</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-0 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDashboardRoot = navItems[0].href === item.href;
            const isActive = isDashboardRoot
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mx-0 flex items-center gap-3 border-l-2 border-transparent px-5 py-3.5 text-base font-semibold text-white/95 transition-colors",
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

        {/* Mobile sign out */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-0 md:pl-[218px]">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/10 bg-[#f6f6f7] px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden text-xs font-semibold uppercase tracking-widest text-slate-400 sm:inline">
              {role === "admin" ? "Admin Portal" : role === "registrar" ? "Registrar Portal" : "Parent Portal"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-slate-100 focus:outline-none">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-400 bg-[#bf000f] text-xs font-bold text-white">
                    {getInitials(session?.user?.name)}
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold leading-none text-slate-900">{session?.user?.name || "User"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{session?.user?.email || ""}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-5 md:p-6">{children}</main>
      </div>
    </div>
  );
}
