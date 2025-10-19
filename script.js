/* ===== theme toggle with localStorage + prefers-color-scheme ===== */
(function themeInit(){
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  root.setAttribute("data-theme", saved || (prefersLight ? "light" : "dark"));
})();

document.getElementById("themeToggle").addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

/* ===== dynamic year ===== */
document.getElementById("year").textContent = new Date().getFullYear();

/* ===== project data (edit here) ===== */
const projects = [
  {
    title: "NeuNest — Smart‑home app",
    year: "2025",
    tags: ["app","case"],
    img: "https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=1200&auto=format&fit=crop",
    alt: "Mobile dashboard with smart lights and thermostat",
    link: "https://dribbble.com/KhaledJawan"
  },
  {
    title: "FoodieLand — Pizza builder",
    year: "2024",
    tags: ["web","case"],
    img: "https://images.unsplash.com/photo-1541745537413-b804db0d0246?q=80&w=1200&auto=format&fit=crop",
    alt: "Website UI with custom pizza builder",
    link: "#"
  },
  {
    title: "THW Campaign Posters",
    year: "2024",
    tags: ["branding","web"],
    img: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?q=80&w=1200&auto=format&fit=crop",
    alt: "Poster grid with bold typography",
    link: "#"
  },
  {
    title: "Kiwee — Health ID card",
    year: "2023",
    tags: ["app","web"],
    img: "https://images.unsplash.com/photo-1557825835-a526744517a3?q=80&w=1200&auto=format&fit=crop",
    alt: "Card UI with NFC health profile",
    link: "#"
  },
  {
    title: "Café Finder — UI Kit",
    year: "2022",
    tags: ["app"],
    img: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop",
    alt: "UI kit components for mobile app",
    link: "#"
  },
  {
    title: "Motion micro‑interactions",
    year: "2022",
    tags: ["app","web"],
    img: "https://images.unsplash.com/photo-1532619187608-e5375cab36aa?q=80&w=1200&auto=format&fit=crop",
    alt: "Set of motion micro‑interactions",
    link: "#"
  }
];

/* ===== render grid ===== */
const grid = document.getElementById("workGrid");
const tpl = document.getElementById("workCardTemplate");

function render(items) {
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();
  items.forEach(p => {
    const node = tpl.content.cloneNode(true);
    const article = node.querySelector(".work-card");
    const a = node.querySelector(".thumb");
    const img = node.querySelector("img");
    const title = node.querySelector(".card-title");
    const meta = node.querySelector(".card-meta");
    const year = node.querySelector(".year");

    a.href = p.link || "#";
    img.src = p.img;
    img.alt = p.alt || p.title;
    title.textContent = p.title;
    year.textContent = p.year || "";
    article.dataset.tags = p.tags.join(",");
    meta.textContent = p.tags.map(t => t[0].toUpperCase() + t.slice(1)).join(" · ");

    frag.appendChild(node);
  });
  grid.appendChild(frag);
}
render(projects);

/* ===== filters ===== */
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    const tag = chip.dataset.filter;
    if (tag === "all") {
      render(projects);
    } else {
      render(projects.filter(p => p.tags.includes(tag)));
    }
  });
});

/* ===== keyboard 'back to top' ===== */
document.querySelector(".back-to-top").addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
