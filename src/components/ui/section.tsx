<<<<<<< HEAD
import React from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className, id }) => {
  return (
    <section className={cn("py-12", className)} id={id}>
      {children}
    </section>
  );
};
=======
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
}

export function Section({ children, className }: SectionProps) {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      {children}
    </section>
  );
}
>>>>>>> 72137904331d5e2c81861c43cf8072852de0d7b2
