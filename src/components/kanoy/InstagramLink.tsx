import { Instagram } from "lucide-react";

export function InstagramLink() {
  return (
    <a
      href="https://www.instagram.com/kanoy.pt/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="absolute bottom-6 right-6 z-50 text-neutral-400/70 transition-colors duration-200 hover:text-neutral-300 md:bottom-10 md:right-10"
    >
      <Instagram className="h-5 w-5" strokeWidth={1.5} />
    </a>
  );
}
