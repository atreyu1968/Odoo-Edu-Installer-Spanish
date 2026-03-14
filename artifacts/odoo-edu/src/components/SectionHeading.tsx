import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  description?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({ badge, title, description, centered = true, className }: SectionHeadingProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className={cn("mb-12 max-w-3xl", centered && "mx-auto text-center", className)}
    >
      {badge && (
        <span className="inline-block py-1 px-3 mb-4 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold tracking-wide uppercase">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-6">
        {title}
      </h2>
      {description && (
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
}
