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

type UserSession = { userId: string; email: string; name: string };
type Pet = { id: string; ownerId: string; name: string; species: "dog" | "cat" | "bird" | "other"; breed?: string };
type Booking = { id: string; petId: string; providerId: string; serviceType: string; scheduledAt: string; status: string; total: number; paymentMethod: string; payment?: { id: string } };

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
  const [session, setSession] = useState<UserSession | null>(null);
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [userId, setUserId] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [petError, setPetError] = useState("");
  const [savingPet, setSavingPet] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [savingBooking, setSavingBooking] = useState(false);
  const [providers, setProviders] = useState<Provider[]>(fallbackProviders);
  const [activeService, setActiveService] = useState("all");
  const [city, setCity] = useState("Bogotá");
  const [activeTab, setActiveTab] = useState("home");
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const restoreSession = () => {
      const savedSession = window.localStorage.getItem("petcare-session");
      if (!savedSession) return;
      try {
        const parsedSession = JSON.parse(savedSession) as UserSession & { userId?: string };
        if (parsedSession.userId) {
          setSession(parsedSession);
          setUserId(parsedSession.userId);
        } else {
          window.localStorage.removeItem("petcare-session");
        }
      } catch {
        window.localStorage.removeItem("petcare-session");
      }
    };
    const timer = window.setTimeout(restoreSession, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/providers`).then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Provider[]) => setProviders(data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/users/${userId}/pets`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Pet[]) => setPets(data))
      .catch(() => setPetError("No se pudieron cargar tus mascotas. Verifica que el backend esté activo."));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/bookings?userId=${encodeURIComponent(userId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Booking[]) => setBookings(data))
      .catch(() => undefined);
  }, [userId]);

  const filteredProviders = useMemo(() => providers.filter((provider) =>
    (!city || provider.city === city) && (activeService === "all" || provider.services.includes(activeService)),
  ), [activeService, city, providers]);

  const openBooking = (provider?: Provider) => {
    setBookingError("");
    if (!pets.length) {
      setPetError("Agrega una mascota antes de crear una reserva.");
      document.getElementById("pets")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setBookingProvider(provider ?? filteredProviders[0] ?? fallbackProviders[0]);
  };

  const handleBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookingProvider || !userId) return;
    setSavingBooking(true);
    setBookingError("");
    const formData = new FormData(event.currentTarget);
    const scheduledAt = `${formData.get("date")}T${formData.get("time")}:00`;
    try {
      const response = await fetch(`${API_URL}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 45000, method: formData.get("paymentMethod"), booking: { userId, petId: formData.get("petId"), providerId: bookingProvider.id, serviceType: formData.get("serviceType"), visitMode: formData.get("visitMode"), scheduledAt, notes: formData.get("notes") } }) });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message);
      if (data.bookingStatus !== "queued") throw new Error("Selecciona pago en línea para confirmar la reserva automáticamente.");
      setBookingProvider(null);
      setNotice(`Pago confirmado. La reserva se está creando con ${data.reference}.`);
      const syncBooking = async () => {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const bookingResponse = await fetch(`${API_URL}/bookings?paymentId=${encodeURIComponent(data.id)}`);
          if (bookingResponse.ok) {
            const createdBookings = await bookingResponse.json() as Booking[];
            if (createdBookings.length) {
              setBookings((currentBookings) => [...createdBookings, ...currentBookings.filter((booking) => booking.payment?.id !== data.id)]);
              return;
            }
          }
          await new Promise((resolve) => window.setTimeout(resolve, 500));
        }
      };
      void syncBooking();
      window.setTimeout(() => setNotice(""), 6000);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "No se pudo crear la reserva.");
    } finally {
      setSavingBooking(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setLoginError("Ingresa tu correo electrónico.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail }) });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message);
      const nextSession = { userId: data.id, email: data.email, name: data.name };
      window.localStorage.setItem("petcare-session", JSON.stringify(nextSession));
      setSession(nextSession);
      setUserId(data.id);
      setLoginError("");
    } catch (error) {
      setLoginError(error instanceof Error && error.message.startsWith("No existe") ? error.message : "No se pudo conectar con PetCare. Inicia el backend en http://localhost:3000.");
    }
  };

  const handlePetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPet(true);
    setPetError("");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_URL}/users/${userId}/pets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formData.get("name"), species: formData.get("species"), breed: formData.get("breed") || undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message);
      setPets((currentPets) => [...currentPets, data]);
      setPetModalOpen(false);
      event.currentTarget.reset();
    } catch (error) {
      setPetError(error instanceof Error ? error.message : "No se pudo guardar la mascota.");
    } finally {
      setSavingPet(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("petcare-session");
    setSession(null);
    setUserId("");
    setPets([]);
    setBookings([]);
    setEmail("");
  };

  const currentUser = session ?? { name: "", email: "" };
  const serviceLabel = (serviceId: string) => services.find((service) => service.id === serviceId)?.label ?? serviceId;
  const petName = (petId: string) => pets.find((pet) => pet.id === petId)?.name ?? "Mascota";
  const providerName = (providerId: string) => providers.find((provider) => provider.id === providerId)?.name ?? "Proveedor";
  const formatBookingDate = (date: string) => new Date(date).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });

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
          <div className="profile"><div className="avatar">{currentUser.name.slice(0, 2).toUpperCase()}</div><div><strong>{currentUser.name}</strong><small>{currentUser.email}</small></div><button className="logout-button" onClick={handleLogout}>Salir</button></div>
        </div>
      </aside>

      <section className={activeTab === "home" ? "main-content" : "main-content viewing-page"}>
        <header className="topbar"><button className="mobile-menu" aria-label="Abrir menú">☰</button><div className="breadcrumb">Inicio <span>/</span> Dashboard</div><div className="top-actions"><button className="icon-button"><Icon name="bell" /><i /></button><div className="mini-avatar">{currentUser.name.slice(0, 2).toUpperCase()}</div></div></header>
        {activeTab === "calendar" && <section className="workspace-page"><div className="page-heading"><div><p className="eyebrow">MI ACTIVIDAD</p><h1>Mis reservas</h1><p className="muted">Consulta y revisa las reservas asociadas a tus mascotas.</p></div><button className="primary-button" onClick={() => openBooking()}><Icon name="plus" /> Nueva reserva</button></div>{bookings.length ? <div className="booking-list">{bookings.map((booking) => <article className="booking-card" key={booking.id}><div className="booking-card-icon">📅</div><div className="booking-card-main"><div><h3>{serviceLabel(booking.serviceType)}</h3><p>{petName(booking.petId)} · {providerName(booking.providerId)}</p></div><span className={`status status-${booking.status}`}>{booking.status === "confirmed" ? "Confirmada" : booking.status}</span><strong>{formatBookingDate(booking.scheduledAt)}</strong><small>{booking.paymentMethod === "online" ? "Pago en línea" : "Pago en el local"} · Bs {booking.total}</small></div></article>)}</div> : <div className="empty-page"><div>📅</div><h2>Aún no tienes reservas</h2><p>Elige un proveedor y agenda el cuidado que necesita tu mascota.</p><button className="primary-button" onClick={() => openBooking()}>Crear mi primera reserva <Icon name="arrow" /></button></div>}</section>}
        {activeTab === "paw" && <section className="workspace-page"><div className="page-heading"><div><p className="eyebrow">TUS COMPAÑEROS</p><h1>Mis mascotas</h1><p className="muted">Aquí puedes ver y administrar las mascotas de tu cuenta.</p></div><button className="primary-button" onClick={() => { setPetError(""); setPetModalOpen(true); }}><Icon name="plus" /> Agregar mascota</button></div>{pets.length ? <div className="pet-list">{pets.map((pet) => <article className="pet-card" key={pet.id}><div className={`pet-card-avatar pet-${pet.species}`}>{pet.species === "cat" ? "🐱" : pet.species === "bird" ? "🐦" : pet.species === "dog" ? "🐶" : "🐾"}</div><div><h3>{pet.name}</h3><p>{pet.species === "dog" ? "Perro" : pet.species === "cat" ? "Gato" : pet.species === "bird" ? "Ave" : "Otro"}</p><small>{pet.breed || "Raza no especificada"}</small></div></article>)}</div> : <div className="empty-page"><div>🐾</div><h2>Aún no tienes mascotas</h2><p>Agrega tu primera mascota para poder reservar servicios.</p><button className="primary-button" onClick={() => setPetModalOpen(true)}><Icon name="plus" /> Agregar mascota</button></div>}</section>}
        <div className="content-wrap">
          <div className="welcome-row"><div><p className="eyebrow">MI ESPACIO PETCARE</p><h1>Buenos días, {currentUser.name} <span>👋</span></h1><p className="muted">Todo lo que tus mascotas necesitan, en un solo lugar.</p></div><button className="primary-button" onClick={() => openBooking()}><Icon name="plus" /> Nueva reserva</button></div>
          <section className="hero-card"><div className="hero-copy"><span className="pill">PARA TU PRÓXIMA VISITA</span><h2>El bienestar de tu mascota<br /><em>empieza aquí.</em></h2><p>Encuentra servicios confiables y agenda en minutos.</p><button className="white-button" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>Explorar servicios <Icon name="arrow" /></button></div><div className="hero-art"><div className="sun" /><div className="hero-paw">🐾</div><div className="plant plant-one">✿</div><div className="plant plant-two">❧</div></div></section>
          <section className="quick-stats"><div className="stat"><span className="stat-icon peach-bg">📅</span><div><small>Próxima reserva</small><strong>Sin reservas próximas</strong><a href="#services">Agendar ahora <Icon name="arrow" /></a></div></div><div className="stat"><span className="stat-icon blue-bg">🐶</span><div><small>Mascotas registradas</small><strong>{pets.length} {pets.length === 1 ? "mascota" : "mascotas"}</strong><a href="#pets">Ver mis mascotas <Icon name="arrow" /></a></div></div><div className="stat"><span className="stat-icon mint-bg">🎁</span><div><small>Beneficio disponible</small><strong>10% de descuento</strong><a href="#services">Usar beneficio <Icon name="arrow" /></a></div></div></section>
          <section id="services" className="section-block"><div className="section-heading"><div><p className="eyebrow">CUIDADOS PARA ELLOS</p><h2>¿Qué necesita tu mascota?</h2></div><button className="text-button">Ver todos <Icon name="arrow" /></button></div><div className="service-grid">{services.map((service) => <button key={service.id} className={`service-card ${service.color}`} onClick={() => setActiveService(service.id)}><span className="service-emoji">{service.emoji}</span><strong>{service.label}</strong><small>Explorar <Icon name="arrow" /></small></button>)}</div></section>
          <section className="section-block provider-section"><div className="section-heading"><div><p className="eyebrow">SERVICIOS CERCA DE TI</p><h2>Proveedores destacados</h2></div><div className="filters"><label><Icon name="pin" /><select value={city} onChange={(event) => setCity(event.target.value)}><option>Bogotá</option><option>Medellín</option></select></label><button className="filter-button"><Icon name="search" /> Filtrar</button></div></div><div className="provider-grid">{filteredProviders.length ? filteredProviders.map((provider, index) => <article className="provider-card" key={provider.id}><div className={`provider-image provider-image-${index + 1}`}><span>{index === 0 ? "🐕" : "🐈"}</span><b>★ 4.{index ? "8" : "9"}</b></div><div className="provider-info"><div className="provider-title"><div><h3>{provider.name}</h3><p><Icon name="pin" /> {provider.address}</p></div><span className="verified">✓</span></div><div className="tags">{provider.services.slice(0, 2).map((service) => <span key={service}>{service === "grooming" ? "Peluquería" : service === "veterinary" ? "Veterinaria" : service === "walking" ? "Paseos" : "Guardería"}</span>)}</div><button className="outline-button" onClick={() => setBookingProvider(provider)}>Ver disponibilidad <Icon name="arrow" /></button></div></article>) : <div className="empty-state">No encontramos proveedores para este filtro. Prueba otra ciudad.</div>}</div></section>
          <section id="pets" className="pets-banner"><div><p className="eyebrow">TUS COMPAÑEROS</p><h2>Cuida cada detalle de su salud.</h2><p>{pets.length ? pets.map((pet) => pet.name).join(", ") : "Aún no tienes mascotas registradas."}</p><button className="dark-button" onClick={() => { setPetError(""); setPetModalOpen(true); }}>Agregar mascota <Icon name="plus" /></button></div><div className="pet-stack"><span>🐶</span><span>🐱</span></div></section>
          {petError && <p className="api-error" role="alert">{petError}</p>}
        </div>
      </section>
      <nav className="mobile-nav">{[["home", "Inicio"], ["calendar", "Reservas"], ["paw", "Mascotas"], ["bell", "Avisos"]].map(([id, label]) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}><Icon name={id as "home"} />{label}</button>)}</nav>
      {notice && <div className="toast">✓ <span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
      {bookingProvider && <div className="modal-backdrop" onClick={() => setBookingProvider(null)}><div className="booking-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setBookingProvider(null)}><Icon name="close" /></button><p className="eyebrow">NUEVA RESERVA</p><h2>Agenda con {bookingProvider.name}</h2><p className="muted">Primero confirmaremos tu pago y después crearemos la reserva.</p><form onSubmit={handleBookingSubmit}><label>Mascota<select name="petId" required defaultValue={pets[0]?.id}>{pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label><label>Servicio<select name="serviceType" required defaultValue={activeService === "all" ? "grooming" : activeService}>{services.filter((service) => bookingProvider.services.includes(service.id)).map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}</select></label><div className="form-row"><label>Fecha<input name="date" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label><label>Hora<input name="time" required type="time" defaultValue="10:00" /></label></div><label>Modalidad<select name="visitMode" required defaultValue="at-location"><option value="at-location">En el local</option>{bookingProvider.acceptsHomeVisits && <option value="home-visit">Visita a domicilio</option>}</select></label><label>Pago<select name="paymentMethod" required defaultValue="online"><option value="online">Pago en línea</option><option value="at-location">Pagar en el local</option></select></label><label>Notas (opcional)<textarea name="notes" placeholder="Cuéntanos algo importante..." rows={3} /></label>{bookingError && <p className="login-error" role="alert">{bookingError}</p>}<button className="primary-button full-button" type="submit" disabled={savingBooking}>{savingBooking ? "Confirmando pago…" : "Pagar y reservar"} <Icon name="arrow" /></button></form></div></div>}
      {!session && <div className="login-backdrop"><section className="login-card" aria-labelledby="login-title"><div className="login-brand"><span className="brand-mark">✦</span><span>pet<span>care</span></span></div><p className="eyebrow">ACCESO A PETCARE</p><h1 id="login-title">Entra a tu espacio</h1><p className="muted">Usa tu correo para identificarte y gestionar tus reservas y mascotas.</p><form onSubmit={handleLogin}><label htmlFor="login-email">Correo electrónico<input id="login-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setLoginError(""); }} placeholder="tu@correo.com" autoComplete="email" required autoFocus /></label>{loginError && <p className="login-error" role="alert">{loginError}</p>}<button className="primary-button full-button" type="submit">Continuar <Icon name="arrow" /></button></form><small className="login-note">No necesitas crear una cuenta ni usar contraseña.</small></section></div>}
      {petModalOpen && <div className="modal-backdrop" onClick={() => setPetModalOpen(false)}><section className="booking-modal pet-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setPetModalOpen(false)}><Icon name="close" /></button><p className="eyebrow">NUEVA MASCOTA</p><h2>Agrega a tu compañero</h2><p className="muted">Estos datos quedarán asociados a tu correo.</p><form onSubmit={handlePetSubmit}><label>Nombre<input name="name" required placeholder="Ej. Luna" /></label><label>Especie<select name="species" required defaultValue="dog"><option value="dog">Perro</option><option value="cat">Gato</option><option value="bird">Ave</option><option value="other">Otro</option></select></label><label>Raza (opcional)<input name="breed" placeholder="Ej. Mestizo" /></label>{petError && <p className="login-error" role="alert">{petError}</p>}<button className="primary-button full-button" type="submit" disabled={savingPet}>{savingPet ? "Guardando…" : "Guardar mascota"} <Icon name="arrow" /></button></form></section></div>}
    </main>
  );
}
