type Props = {
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeader({ title, description, className = '' }: Props) {
  return (
    <header className={className}>
      <h2 className="dh-sec-title">{title}</h2>
      {description ? <p className="dh-sec-desc">{description}</p> : null}
    </header>
  );
}
