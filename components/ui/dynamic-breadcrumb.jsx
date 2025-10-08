"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

/**
 * Dynamic Breadcrumb Component
 * Automatically generates breadcrumbs based on current route
 *
 * @param {Array} items - Optional custom breadcrumb items to override auto-generation
 * @param {string} className - Optional additional CSS classes
 *
 * Usage:
 * 1. Auto-generated: <DynamicBreadcrumb />
 * 2. Custom: <DynamicBreadcrumb items={[{ label: "Custom", href: "/custom" }]} />
 */
export function DynamicBreadcrumb({ items = null, className = "" }) {
  const breadcrumbs = useBreadcrumbs(items);

  return (
    <nav
      className={`flex items-center space-x-1 text-sm text-muted-foreground mb-6 ${className}`}
    >
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
          {item.href && index < breadcrumbs.length - 1 ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors flex items-center gap-1 truncate max-w-[200px]"
            >
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              <span className="truncate">{item.label}</span>
            </Link>
          ) : (
            <span className="text-foreground font-medium flex items-center gap-1 truncate max-w-[200px]">
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              <span className="truncate">{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
