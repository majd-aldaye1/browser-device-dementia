import { PropsWithChildren } from "react";

interface PanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
}

export function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {subtitle ? <p className="muted">{subtitle}</p> : null}
      <div>{children}</div>
    </section>
  );
}
