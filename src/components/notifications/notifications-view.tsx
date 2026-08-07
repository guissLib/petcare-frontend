"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { petcareApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Notification } from "@/types/petcare";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";

const notificationLabels: Record<Notification["type"], string> = {
  confirmation: "Reserva confirmada",
  reminder: "Recordatorio",
  completion: "Servicio completado",
  rejection: "Reserva rechazada",
};

const notificationEmojis: Record<Notification["type"], string> = {
  confirmation: "✅",
  reminder: "⏰",
  completion: "🎉",
  rejection: "⚠️",
};

export function NotificationsView() {
  const { session } = usePetcareSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      setNotifications(await petcareApi.listNotifications(session.userId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar tus notificaciones.",
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotifications(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  if (loading) {
    return (
      <main className="workspace-page">
        <LoadingState label="Cargando tus notificaciones…" />
      </main>
    );
  }

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MANTENTE AL DÍA</p>
          <h1>Notificaciones</h1>
          <p className="muted">
            Aquí encontrarás confirmaciones, recordatorios y novedades.
          </p>
        </div>
        {unreadCount > 0 && <span className="unread-summary">{unreadCount} nuevas</span>}
      </div>

      {error && (
        <ErrorState message={error} onRetry={() => void loadNotifications()} />
      )}
      {!error && notifications.length === 0 && (
        <EmptyState
          emoji="🔔"
          title="No tienes notificaciones"
          description="Te avisaremos cuando haya novedades sobre tus reservas."
        />
      )}
      {!error && notifications.length > 0 && (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article
              className={notification.read ? "notification-card" : "notification-card unread"}
              key={notification.id}
            >
              <span className="notification-emoji">
                {notificationEmojis[notification.type]}
              </span>
              <div>
                <div className="notification-heading">
                  <h2>{notificationLabels[notification.type]}</h2>
                  {!notification.read && <span>Nueva</span>}
                </div>
                <p>{notification.message}</p>
                <small>
                  {formatDate(notification.sentAt)} · {notification.channel}
                </small>
              </div>
              <Icon name="chevron" />
            </article>
          ))}
        </div>
      )}
      <p className="api-note">
        <Icon name="bell" /> Las notificaciones se generan en el backend y se
        entregan mediante el canal simulado `mock-push`.
      </p>
    </main>
  );
}
