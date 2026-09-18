import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "../icons";

export function SectionHeader({
  title,
  text,
  href,
  linkLabel,
  as: Tag = "h2",
}: {
  title: string;
  text?: string;
  href?: string;
  linkLabel?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <Tag className="section-title">{title}</Tag>
        {text && <p className="section-sub">{text}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="link-more">
          {linkLabel}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
