export function Section({ eyebrow, title, description, children }) {
  return (
    <section className="section">
      <div className="section__heading">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
