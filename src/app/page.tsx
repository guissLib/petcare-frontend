"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Provider = {
  id: string;
  name: string;
  city: string;
  address: string;
  services: string[];
  acceptsHomeVisits: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
const fallbackProviders: Provider[] = [
  { id: "provider_centro", name: "PetCare Centro", city: "Bogotá", address: "Calle 100 # 12-30", services: ["grooming", "veterinary", "walking", "home-visit"], acceptsHomeVisits: true },
  { id: "provider_norte", name: "PetCare Norte", city: "Medellín", address: "Carrera 43A # 10-20", services: ["grooming", "boarding", "veterinary"], acceptsHomeVisits: false },
];
const services = [
  { id: "grooming", label: "Baño y peluquería", emoji: "✂️", color: "peach" },
  { id: "veterinary", label: "Veterinaria", emoji: "🩺", color: "blue" },
  { id: "walking", label: "Paseos", emoji: "🦮", color: "mint" },
  { id: "boarding", label: "Guardería", emoji: "🏡", color: "lavender" },
];

function Icon({ name }: { name: "home" | "calendar" | "paw" | "bell" | "search" | "arrow" | "plus" | "close" | "pin" }) {
  const paths: Record<string, string> = {
    home: "M3 10.5 12 3l9 7.5M5.5 9v10h13V9M9 19v-6h6v6",
    calendar: "M5 4v3M19 4v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1ZM8 12h2M14 12h2M8 16h2",
    paw: "M8 10c-1.4 0-2.5-1.4-2.5-3S6.6 4.5 8 4.5 10.5 5.9 10.5 7 9.4 10 8 10Zm8 0c1.4 0 2.5-1.4 2.5-3S17.4 4.5 16 4.5 13.5 5.9 13.5 7s1.1 3 2.5 3ZM12 11c-2.5 0-5 3-5 5.5 0 1.8 1.4 2.5 3 2.5.9 0 1.4-.5 2-.5s1.1.5 2 .5c1.6 0 3-.7 3-2.5C17 14 14.5 11 12 11Z",
    bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8ZM10 21h4",
    search: "m20 20-4.5-4.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    plus: "M12 5v14M5 12h14",
    close: "M6 6l12 12M18 6 6 18",
    pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  };
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

export default function Home() {
  const [providers, setProviders] = useState<Provider[]>(fallbackProviders);
  const [activeService, setActiveService] = useState("all");
  const [city, setCity] = useState("Bogotá");
  const [activeTab, setActiveTab] = useState("home");
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/providers`).then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Provider[]) => setProviders(data)).catch(() => undefined);
  }, []);

  const filteredProviders = useMemo(() => providers.filter((provider) =>
    (!city || provider.city === city) && (activeService === "all" || provider.services.includes(activeService)),
  ), [activeService, city, providers]);

  const handleBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBookingProvider(null);
    setNotice("¡Listo! Tu solicitud quedó preparada. Regístrate para confirmar la reserva.");
    window.setTimeout(() => setNotice(""), 5000);
  };

  const openBooking = () => setBookingProvider(filteredProviders[0] ?? fallbackProviders[0]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><span>pet<span>care</span></span></div>
        <p className="menu-label">MENÚ PRINCIPAL</p>
        <nav className="side-nav" aria-label="Navegación principal">
          {[["home", "Inicio", "home"], ["calendar", "Mis reservas", "calendar"], ["paw", "Mis mascotas", "paw"], ["bell", "Notificaciones", "bell"]].map(([id, label, icon]) => (
            <button className={activeTab === id ? "nav-item active" : "nav-item"} key={id} onClick={() => setActiveTab(id)}><Icon name={icon as "home"} /><span>{label}</span>{id === "bell" && <b className="notification-dot">2</b>}</button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span>💡</span><strong>¿Necesitas ayuda?</strong><small>Estamos para ayudarte</small><button>Centro de ayuda <Icon name="arrow" /></button></div>
          <div className="profile"><div className="avatar">GS</div><div><strong>Guisela S.</strong><small>Mi cuenta</small></div><span className="dots">•••</span></div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar"><button className="mobile-menu" aria-label="Abrir menú">☰</button><div className="breadcrumb">Inicio <span>/</span> Dashboard</div><div className="top-actions"><button className="icon-button"><Icon name="bell" /><i /></button><div className="mini-avatar">GS</div></div></header>
        <div className="content-wrap">
          <div className="welcome-row"><div><p className="eyebrow">MI ESPACIO PETCARE</p><h1>Buenos días, Guisela <span>👋</span></h1><p className="muted">Todo lo que tus mascotas necesitan, en un solo lugar.</p></div><button className="primary-button" onClick={openBooking}><Icon name="plus" /> Nueva reserva</button></div>
          <section className="hero-card"><div className="hero-copy"><span className="pill">PARA TU PRÓXIMA VISITA</span><h2>El bienestar de tu mascota<br /><em>empieza aquí.</em></h2><p>Encuentra servicios confiables y agenda en minutos.</p><button className="white-button" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>Explorar servicios <Icon name="arrow" /></button></div><div className="hero-art"><div className="sun" /><div className="hero-paw">🐾</div><div className="plant plant-one">✿</div><div className="plant plant-two">❧</div></div></section>
          <section className="quick-stats"><div className="stat"><span className="stat-icon peach-bg">📅</span><div><small>Próxima reserva</small><strong>Sin reservas próximas</strong><a href="#services">Agendar ahora <Icon name="arrow" /></a></div></div><div className="stat"><span className="stat-icon blue-bg">🐶</span><div><small>Mascotas registradas</small><strong>2 mascotas</strong><a href="#pets">Ver mis mascotas <Icon name="arrow" /></a></div></div><div className="stat"><span className="stat-icon mint-bg">🎁</span><div><small>Beneficio disponible</small><strong>10% de descuento</strong><a href="#services">Usar beneficio <Icon name="arrow" /></a></div></div></section>
          <section id="services" className="section-block"><div className="section-heading"><div><p className="eyebrow">CUIDADOS PARA ELLOS</p><h2>¿Qué necesita tu mascota?</h2></div><button className="text-button">Ver todos <Icon name="arrow" /></button></div><div className="service-grid">{services.map((service) => <button key={service.id} className={`service-card ${service.color}`} onClick={() => setActiveService(service.id)}><span className="service-emoji">{service.emoji}</span><strong>{service.label}</strong><small>Explorar <Icon name="arrow" /></small></button>)}</div></section>
          <section className="section-block provider-section"><div className="section-heading"><div><p className="eyebrow">SERVICIOS CERCA DE TI</p><h2>Proveedores destacados</h2></div><div className="filters"><label><Icon name="pin" /><select value={city} onChange={(event) => setCity(event.target.value)}><option>Bogotá</option><option>Medellín</option></select></label><button className="filter-button"><Icon name="search" /> Filtrar</button></div></div><div className="provider-grid">{filteredProviders.length ? filteredProviders.map((provider, index) => <article className="provider-card" key={provider.id}><div className={`provider-image provider-image-${index + 1}`}><span>{index === 0 ? "🐕" : "🐈"}</span><b>★ 4.{index ? "8" : "9"}</b></div><div className="provider-info"><div className="provider-title"><div><h3>{provider.name}</h3><p><Icon name="pin" /> {provider.address}</p></div><span className="verified">✓</span></div><div className="tags">{provider.services.slice(0, 2).map((service) => <span key={service}>{service === "grooming" ? "Peluquería" : service === "veterinary" ? "Veterinaria" : service === "walking" ? "Paseos" : "Guardería"}</span>)}</div><button className="outline-button" onClick={() => setBookingProvider(provider)}>Ver disponibilidad <Icon name="arrow" /></button></div></article>) : <div className="empty-state">No encontramos proveedores para este filtro. Prueba otra ciudad.</div>}</div></section>
          <section id="pets" className="pets-banner"><div><p className="eyebrow">TUS COMPAÑEROS</p><h2>Cuida cada detalle de su salud.</h2><p>Ten sus vacunas y datos importantes siempre a la mano.</p><button className="dark-button">Gestionar mascotas <Icon name="arrow" /></button></div><div className="pet-stack"><span>🐶</span><span>🐱</span></div></section>
        </div>
      </section>
      <nav className="mobile-nav">{[["home", "Inicio"], ["calendar", "Reservas"], ["paw", "Mascotas"], ["bell", "Avisos"]].map(([id, label]) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}><Icon name={id as "home"} />{label}</button>)}</nav>
      {notice && <div className="toast">✓ <span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
      {bookingProvider && <div className="modal-backdrop" onClick={() => setBookingProvider(null)}><div className="booking-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setBookingProvider(null)}><Icon name="close" /></button><p className="eyebrow">NUEVA RESERVA</p><h2>Agenda con {bookingProvider.name}</h2><p className="muted">Elige el servicio y el momento ideal para tu mascota.</p><form onSubmit={handleBooking}><label>Servicio<select required defaultValue={activeService === "all" ? "grooming" : activeService}>{services.filter((service) => bookingProvider.services.includes(service.id)).map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}</select></label><div className="form-row"><label>Fecha<input required type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label><label>Hora<input required type="time" defaultValue="10:00" /></label></div><label>Notas (opcional)<textarea placeholder="Cuéntanos algo importante..." rows={3} /></label><button className="primary-button full-button" type="submit">Continuar con la reserva <Icon name="arrow" /></button></form></div></div>}
    </main>
  );
}
