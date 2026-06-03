import Link from "next/link";
import { Gamepad2, GitBranch, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6 py-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Gamepad2 className="size-4 text-[#478CBF]" />
          <span>&copy; 2026 Godot Learning Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/Angelionix/Godot_Learning"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <GitBranch className="size-4" />
            <span>GitHub</span>
          </Link>
          <Link
            href="https://godotengine.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" />
            <span>Godot Engine</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
