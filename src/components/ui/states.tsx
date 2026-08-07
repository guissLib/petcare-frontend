import type { ReactNode } from "react";
import { Icon } from "@/components/icon";

export function LoadingState({ label = "Cargando información…" }: { label?: string }) {
  return (
    <div className="state-card loading-state" role="status">
      <span className="loader" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-card error-state" role="alert">
      <span>!</span>
      <p>{message}</p>
      {onRetry && (
        <button className="text-button" onClick={onRetry}>
          Intentar de nuevo <Icon name="arrow" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-card empty-page">
      <div>{emoji}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
