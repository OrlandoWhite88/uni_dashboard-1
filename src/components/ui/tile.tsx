import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TileProps {
  children: ReactNode;
  className?: string;
}

export function Tile({ children, className }: TileProps) {
  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm md:flex-row", className)}>
      {children}
    </div>
  );
}

interface TileHeaderProps {
  children: ReactNode;
  className?: string;
}

export function TileHeader({ children, className }: TileHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  );
}

interface TileContentProps {
  children: ReactNode;
  className?: string;
}

export function TileContent({ children, className }: TileContentProps) {
  return (
    <div className={cn("flex flex-col gap-3 p-6", className)}>
      {children}
    </div>
  );
}

interface TileVisualProps {
  children: ReactNode;
  className?: string;
}

export function TileVisual({ children, className }: TileVisualProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {children}
    </div>
  );
}

interface TileTitleProps {
  children: ReactNode;
  className?: string;
}

export function TileTitle({ children, className }: TileTitleProps) {
  return (
    <h3 className={cn("text-xl font-semibold", className)}>
      {children}
    </h3>
  );
}

interface TileDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function TileDescription({ children, className }: TileDescriptionProps) {
  return (
    <div className={cn("text-muted-foreground text-sm", className)}>
      {children}
    </div>
  );
}

interface TileLinkProps {
  children?: ReactNode;
  href?: string;
  className?: string;
}

export function TileLink({ children, href, className }: TileLinkProps) {
  if (!href || !children) {
    return <span className="absolute inset-0" />;
  }
  
  return (
    <a 
      href={href}
      className={cn("text-sm font-medium text-primary hover:underline", className)}
    >
      {children}
    </a>
  );
}
