import { Link } from "react-router-dom";

interface CubeArticle {
  id: string;
  title: string;
  image_url: string | null;
  category_name?: string;
}

const FACE_COUNT = 4;

const NewsCube3D = ({ articles }: { articles: CubeArticle[] }) => {
  const items = articles.slice(0, FACE_COUNT);
  while (items.length < FACE_COUNT) items.push(items[0] || { id: "", title: "مصدري", image_url: null });

  // Cube: 4 vertical faces (front/right/back/left), translateZ by half-side
  // Approximate side based on container width via CSS variable trick: use fixed depth.
  const depth = 220; // px

  return (
    <div className="scene-3d w-full h-72 md:h-96 mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-[hsl(var(--royal-blue-dark))] to-[hsl(var(--royal-blue))]"
         style={{ boxShadow: "inset 0 0 60px hsl(220 70% 4% / 0.6), 0 0 0 2px hsl(var(--gold) / 0.5)" }}>
      <div className="cube-3d mx-auto" style={{ width: "100%", height: "100%" }}>
        {items.map((a, i) => {
          const rotateY = i * 90;
          return (
            <Link
              key={i}
              to={a.id ? `/article/${a.id}` : "/"}
              className="cube-face flex items-end"
              style={{ transform: `rotateY(${rotateY}deg) translateZ(${depth}px)` }}
            >
              {a.image_url ? (
                <img src={a.image_url} alt={a.title} className="absolute inset-0 w-full h-full object-cover opacity-70" loading="lazy" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-[hsl(var(--royal-blue-light))]" />
              )}
              <div className="relative z-10 p-4 md:p-6 w-full bg-gradient-to-t from-[hsl(220_70%_5%/0.9)] to-transparent">
                {a.category_name && (
                  <span className="inline-block bg-accent text-accent-foreground px-2 py-0.5 text-[11px] font-bold mb-2">
                    {a.category_name}
                  </span>
                )}
                <h3 className="text-white font-black text-lg md:text-2xl leading-snug line-clamp-2"
                    style={{ textShadow: "2px 2px 8px rgba(0,0,0,.7)" }}>
                  {a.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default NewsCube3D;
