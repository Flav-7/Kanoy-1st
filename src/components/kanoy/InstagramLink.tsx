import { Instagram } from "lucide-react";

export function InstagramLink() {
  return (
    <a
      href="https://www.instagram.com/kanoy.pt/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="text-neutral-400/70 transition-colors duration-200 hover:text-neutral-300"
    >
      <Instagram className="h-5 w-5" strokeWidth={1.5} />
    </a>
  );
}
