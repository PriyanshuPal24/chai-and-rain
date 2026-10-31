import { useEffect, useState } from "react";

export default function About() {
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    fetch("/api/features")
      .then((r) => r.json())
      .then(setFeatures)
      .catch(() => setFeatures([]));
  }, []);

  return (
    <section id="about" className="section">
      <p className="eyebrow">ABOUT</p>
      <h2 className="section-title">The Midnight Tapri</h2>
      <p className="lead">
        Standing under a plastic tarp at a roadside tea stall during a heavy midnight downpour.
        Hit play, order a cutting chai and let the rain do the rest.
      </p>

      <div className="cards">
        {features.map((f) => (
          <article className="card" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
