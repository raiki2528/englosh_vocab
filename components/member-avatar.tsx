import { UserRound } from "lucide-react";

export function MemberAvatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-24 w-24 text-2xl",
  }[size];

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`${name}のプロフィール写真`}
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-1 ring-gray-200`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-500`}
      aria-label={`${name}のプロフィール画像`}
    >
      {name.trim().slice(0, 1).toUpperCase() || (
        <UserRound className="h-1/2 w-1/2" aria-hidden />
      )}
    </div>
  );
}
