type StatusSummaryItem = {
  label: string;
  value: number;
};

type StatusSummaryProps = {
  items: StatusSummaryItem[];
};

export function StatusSummary({ items }: StatusSummaryProps) {
  return (
    <div className="status-summary-grid">
      {items.map((item) => (
        <div key={item.label} className="status-summary-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
