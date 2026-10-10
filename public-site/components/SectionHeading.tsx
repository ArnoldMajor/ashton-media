interface Props {
  /** First line — extrabold. */
  lead: string;
  /** Second line — light. */
  accent: string;
  as?: "h1" | "h2" | "h3";
  /** Size, tracking, leading and spacing. Both lines inherit them, so they can't differ. */
  className?: string;
}

/** Two-line section heading: one typeface, the lines set apart by weight alone. */
export default function SectionHeading({ lead, accent, as: Tag = "h2", className = "" }: Props) {
  return (
    <Tag className={`text-white ${className}`}>
      <span className="block font-extrabold">{lead}</span>
      <span className="block font-light">{accent}</span>
    </Tag>
  );
}
