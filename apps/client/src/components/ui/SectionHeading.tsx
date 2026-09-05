/* Measured: eyebrow h6 12px / 600 / tracking 5px (navy on light, gold on dark);
   section h2 60px / lh 63px / tracking -2.5px Barlow Condensed 600. */

export default function SectionHeading({
  eyebrow,
  title,
  tone = "light",
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={`${align === "center" ? "text-center" : ""} ${className}`}
    >
      {eyebrow ? (
        <h6
          className={`mb-[18px] font-body text-eyebrow font-semibold uppercase ${
            tone === "dark" ? "text-gold" : "text-navy"
          }`}
        >
          {eyebrow}
        </h6>
      ) : null}
      <h2
        className={`font-display text-[40px] font-semibold uppercase leading-[42px] tracking-[-1.5px] lg:text-section lg:leading-[63px] lg:tracking-[-2.5px] ${
          tone === "dark" ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}
