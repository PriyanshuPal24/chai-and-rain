export default function Footer() {
  return (
    <footer className="footer">
      <p className="font-hindi footer-hindi">चाय और बारिश</p>
      <p className="footer-line">Chai &amp; Rain · The Midnight Tapri · Cutting chai, neon lights and soulful tunes</p>
      <nav className="footer-nav" aria-label="Footer">
        <a href="#about">About</a>
        <a href="#faq">FAQ</a>
        <a href="#top">Back to top</a>
      </nav>
      <p className="footer-disclaimer">
        <strong>Disclaimer:</strong> This website is a personal, non-commercial portfolio project built
        solely for educational purposes to demonstrate web development skills. All movie clips, songs,
        audio tracks, and related imagery are the copyrighted property of their respective film
        production houses, music labels, and artists. No copyright infringement is intended, and no
        revenue is generated from this site.
      </p>
      <p className="footer-owner">Created by Priyanshu Pal</p>
    </footer>
  );
}
