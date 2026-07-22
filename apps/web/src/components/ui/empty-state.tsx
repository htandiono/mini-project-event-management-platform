interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="empty-state" aria-live="polite">
      <span className="empty-state__icon" aria-hidden="true">
        ✦
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
