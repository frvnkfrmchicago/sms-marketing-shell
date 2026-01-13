"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Zap,
  Filter,
  ArrowRight,
} from "lucide-react";

const actions = [
  {
    title: "New Campaign",
    description: "Blast message",
    href: "/campaigns/new",
    icon: MessageSquare,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Add Contacts",
    description: "Import or add",
    href: "/contacts/import", // Direct to import as that's more common
    icon: Users,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "New Automation",
    description: "Setup flows",
    href: "/automations/new",
    icon: Zap,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    title: "Create Segment",
    description: "Filter audience",
    href: "/segments",
    icon: Filter,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

export function ActionBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
        >
          <Link
            href={action.href}
            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden"
          >
            <div className={`p-3 rounded-full mb-3 ${action.color} group-hover:scale-110 transition-transform duration-300`}>
              <action.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
              {action.title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {action.description}
            </p>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-3 h-3 text-zinc-400" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
