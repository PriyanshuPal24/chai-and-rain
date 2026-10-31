import { useEffect, useState } from "react";

export default function Faq() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <section id="faq" className="section">
      <p className="eyebrow">FAQ</p>
      <h2 className="section-title">Quick Guide</h2>
      <div className="faq">
        {items.map((item) => (
          <details className="faq-item" key={item.q}>
            <summary>
              {item.q}
              <svg className="faq-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
