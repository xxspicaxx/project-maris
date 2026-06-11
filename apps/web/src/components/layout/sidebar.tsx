"use client";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";
import {
  Anchor,
  ChevronLeft,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Ship,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  {
    label: "Armada",
    href: "/fleet",
    icon: <Ship className="h-4 w-4" />,
    children: [
      { label: "Daftar Kapal", href: "/fleet" },
      { label: "Sertifikat", href: "/fleet/certificates" },
    ],
  },
  {
    label: "Kru",
    href: "/crew",
    icon: <Users className="h-4 w-4" />,
    children: [
      { label: "Daftar Seafarer", href: "/crew" },
      { label: "Manning List", href: "/crew/manning" },
    ],
  },
  {
    label: "Pelayaran",
    href: "/voyage",
    icon: <Anchor className="h-4 w-4" />,
  },
  {
    label: "Teknikal",
    href: "/technical",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    label: "HSSEQ",
    href: "/hsseq",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    label: "Administrasi",
    href: "/admin",
    icon: <Settings className="h-4 w-4" />,
    children: [
      { label: "Pengguna", href: "/admin/users" },
      { label: "Peran & Izin", href: "/admin/roles" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const isChildActive = (children: { href: string }[]) => {
    return children.some((child) => pathname.startsWith(child.href));
  };

  return (
    <aside
      className={cn(
        "flex flex-shrink-0 flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)] transition-all duration-200",
        sidebarOpen ? "w-60" : "w-16",
      )}
    >
      {/* Logo */}
      <div className="flex h-12 items-center border-b border-[var(--color-border-default)] px-4">
        {sidebarOpen ? (
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-[var(--color-primary-400)]" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Maris ERP
            </span>
          </div>
        ) : (
          <Ship className="mx-auto h-5 w-5 text-[var(--color-primary-400)]" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                isActive(item.href) || (item.children && isChildActive(item.children))
                  ? "border-r-2 border-[var(--color-primary-400)] bg-[var(--color-bg-overlay)] text-[var(--color-primary-300)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-primary)]",
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </Link>

            {/* Sub-menu */}
            {sidebarOpen && item.children && isActive(item.href) && (
              <div className="ml-6 border-l border-[var(--color-border-subtle)]">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2 py-1.5 pl-4 pr-4 text-xs transition-colors",
                      pathname === child.href
                        ? "text-[var(--color-primary-300)]"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
                    )}
                  >
                    <div
                      className={cn(
                        "h-1 w-1 rounded-full",
                        pathname === child.href
                          ? "bg-[var(--color-primary-400)]"
                          : "bg-[var(--color-text-tertiary)]",
                      )}
                    />
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className="flex h-8 items-center justify-center border-t border-[var(--color-border-default)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
      >
        <ChevronLeft
          className={cn("h-4 w-4 transition-transform duration-200", !sidebarOpen && "rotate-180")}
        />
      </button>
    </aside>
  );
}
