import Image from "next/image";

/* Shared by /gallery-3-columns and /gallery-4-columns — same tiles, different
   column count. Tiles are the 800x800 crops the source ships. */

const IMAGES = [
  "/wp-content/uploads/2025/05/gallery_01-800x800.jpg",
  "/wp-content/uploads/2025/05/gallery_03-800x800.jpg",
  "/wp-content/uploads/2025/05/gallery_04-800x800.jpg",
  "/wp-content/uploads/2025/05/gallery_05-800x800.jpg",
  "/wp-content/uploads/2025/05/gallery_06-800x800.jpg",
  "/wp-content/uploads/2025/05/gallery_07-800x800.jpg",
];

export default function Gallery({
  columns = 3,
  padding = "py-[110px]",
}: {
  columns?: 3 | 4;
  /** the two gallery routes run this band at slightly different heights */
  padding?: string;
}) {
  return (
    <section className={padding}>
      {/* Measured: tiles are 387x387 at x=110/527/943 — a 1221 content column
          (3x387 + 2x30), not the full 1380 shell. Same bug as the blog grids:
          my tiles were 440 and every column landed left of the source. */}
      <div className="mx-auto max-w-[1221px]">
        <div
          className={`grid gap-x-[30px] gap-y-[106px] sm:grid-cols-2 ${
            columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {IMAGES.map((src) => (
            <div
              key={src}
              className="group relative aspect-square overflow-hidden"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes={columns === 4 ? "(max-width: 1024px) 50vw, 25vw" : "(max-width: 1024px) 50vw, 33vw"}
                className="object-cover transition-[transform,scale] duration-700 ease-out group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
