"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "../lib/LanguageProvider";
import { supabase } from "@/lib/supabase";
import {
  canAccessRoute,
  type UserRole,
} from "../lib/permissions";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRole = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setUserRole(null);
        setRoleLoaded(true);
        return;
      }

      const { data: profile, error } = await supabase
        .from("users")
        .select("role, active")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !profile || profile.active === false) {
        setUserRole(null);
        setRoleLoaded(true);
        return;
      }

      setUserRole(profile.role as UserRole);
      setRoleLoaded(true);
    };

    void loadRole();

    // Usamos el listener de auth de manera segura sin re-disparar bucles de carga
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        void loadRole();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const allNavigation = [
    { name: t.navigation.command, href: "/" },
    { name: t.navigation.operations, href: "/operations" },
    { name: t.navigation.loads, href: "/loads" },
    { name: t.navigation.dispatch, href: "/dispatch" },
    { name: t.navigation.drivers, href: "/drivers" },
    { name: t.navigation.driveApp, href: "/drive" },
    { name: t.navigation.fleet, href: "/fleet" },
    { name: t.navigation.compliance, href: "/compliance" },
    { name: t.navigation.documents, href: "/documents" },
    { name: t.navigation.ai, href: "/ai" },
    { name: t.navigation.finance, href: "/finance" },
    { name: t.navigation.factoring, href: "/factoring" },
    { name: t.navigation.users, href: "/users" },
    { name: t.navigation.settings, href: "/settings" },
  ];

  const navigation = roleLoaded
    ? allNavigation.filter((item) =>
        canAccessRoute(userRole, item.href)
      )
    : [];

  const isDriver = userRole === "driver";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            padding: "0 24px",
            minHeight: "70px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <Link
            href={isDriver ? "/drive" : "/"}
            style={{
              textDecoration: "none",
              color: "#0f172a",
              minWidth: "170px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#2563eb",
                letterSpacing: "2px",
              }}
            >
              PROJECT
            </div>

            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              LOGISTICS
            </div>
          </Link>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              overflowX: "auto",
              flex: 1,
            }}
          >
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    padding: "9px 11px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isActive ? "#1d4ed8" : "#475569",
                    background: isActive
                      ? "#eff6ff"
                      : "transparent",
                  }}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              background: "#f8fafc",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setLanguage("EN")}
              style={{
                border: "none",
                borderRadius: "6px",
                padding: "7px 10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                color:
                  language === "EN" ? "#1d4ed8" : "#64748b",
                background:
                  language === "EN" ? "#ffffff" : "transparent",
              }}
            >
              EN
            </button>

            <button
              type="button"
              onClick={() => setLanguage("ES")}
              style={{
                border: "none",
                borderRadius: "6px",
                padding: "7px 10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                color:
                  language === "ES" ? "#1d4ed8" : "#64748b",
                background:
                  language === "ES" ? "#ffffff" : "transparent",
              }}
            >
              ES
            </button>
          </div>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}
