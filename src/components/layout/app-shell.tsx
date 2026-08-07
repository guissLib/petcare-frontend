"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Icon, type IconName } from "@/components/icon";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { initials } from "@/lib/format";

const ownerNavigation: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Inicio", icon: "home" },
  { href: "/bookings", label: "Mis reservas", icon: "calendar" },
  { href: "/pets", label: "Mis mascotas", icon: "paw" },
  { href: "/providers", label: "Proveedores", icon: "pin" },
  { href: "/notifications", label: "Notificaciones", icon: "bell" },
];

const providerNavigation: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Resumen", icon: "home" },
  { href: "/bookings", label: "Reservas de clientes", icon: "calendar" },
  { href: "/notifications", label: "Notificaciones", icon: "bell" },
];

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/bookings": "Mis reservas",
  "/pets": "Mis mascotas",
  "/providers": "Proveedores",
  "/notifications": "Notificaciones",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready, startSession, endSession } = usePetcareSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!ready) {
    return <div className="loading-screen">Cargando tu espacio…</div>;
  }

  if (!session) {
    return (
      <AuthCard
        initialMode={pathname === "/login" ? "login" : "register"}
        onSessionCreated={startSession}
      />
    );
  }

  const navigation =
    session.role === "provider" ? providerNavigation : ownerNavigation;
  const pageName =
    pageNames[pathname] ??
    (pathname.startsWith("/providers/") ? "Detalle del proveedor" : "PetCare");

  function logout() {
    endSession();
    router.replace("/");
  }

  return (
    <div className="app-shell">
      <aside className={mobileMenuOpen ? "sidebar open" : "sidebar"}>
        <Link className="brand" href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-mark">✦</span>
          <span>
            pet<span>care</span>
          </span>
        </Link>
        <p className="menu-label">MENÚ PRINCIPAL</p>
        <nav className="side-nav" aria-label="Navegación principal">
          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                className={active ? "nav-item active" : "nav-item"}
                href={item.href}
                key={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.href === "/notifications" && <b className="notification-dot">!</b>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span>💡</span>
            <strong>¿Necesitas ayuda?</strong>
            <small>Estamos para ayudarte</small>
            <a href="mailto:hola@petcare.local">
              Centro de ayuda <Icon name="arrow" />
            </a>
          </div>
          <div className="profile">
            <div className="avatar">{initials(session.name)}</div>
            <div className="profile-copy">
              <strong>{session.name}</strong>
              <small>{session.email}</small>
            </div>
            <button className="logout-button" onClick={logout} title="Cerrar sesión">
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <section className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Abrir menú"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            Inicio <span>/</span> {pageName}
          </div>
          <div className="top-actions">
            <Link className="icon-button" href="/notifications" aria-label="Ver notificaciones">
              <Icon name="bell" />
              <i />
            </Link>
            <div className="mini-avatar">{initials(session.name)}</div>
          </div>
        </header>
        {children}
      </section>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navigation.slice(0, 4).map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link className={active ? "active" : ""} href={item.href} key={item.href}>
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
