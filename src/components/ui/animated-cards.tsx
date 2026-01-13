"use client";

import { motion } from "motion/react";
import {
  Users,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  Filter,
  Zap,
  Settings,
  Phone,
  DollarSign,
  MousePointerClick,
  ArrowRight,
} from "lucide-react";

// Map string names to components to avoid detailed client/server boundary issues
const iconMap = {
  Users,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  Filter,
  Zap,
  Settings,
  Phone,
  DollarSign,
  MousePointerClick,
};

export type IconName = keyof typeof iconMap;

interface AnimatedStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  iconName: IconName;
  index: number;
  iconColor?: string;
}

export function AnimatedStatCard({
  title,
  value,
  subtitle,
  iconName,
  index,
  iconColor = "text-blue-500",
}: AnimatedStatCardProps) {
  const Icon = iconMap[iconName];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative overflow-hidden rounded-xl bg-white/10 p-6 shadow-xl backdrop-blur-md border border-white/20 dark:bg-zinc-900/40 dark:border-white/10"
    >
      {/* Gradient Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/5" />
      
      {/* Mesh Gradient Blob for Revenue */}
      {iconName === "DollarSign" && (
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl transition-all duration-500 group-hover:bg-amber-500/30" />
      )}
      {iconName === "MousePointerClick" && (
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl transition-all duration-500 group-hover:bg-cyan-500/30" />
      )}

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
            {title}
          </p>
          <motion.h3 
            className="mt-2 text-3xl font-bold text-gray-900 dark:text-white"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {value}
          </motion.h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {subtitle}
          </p>
        </div>
        <div className={`rounded-xl bg-white/20 p-3 shadow-sm backdrop-blur-sm dark:bg-white/5 ${iconColor}`}>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon className="h-6 w-6" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

interface AnimatedActionCardProps {
  title: string;
  description: string;
  iconName: IconName;
  index: number;
  onClick?: () => void;
  href?: string;
}

export function AnimatedActionCard({
  title,
  description,
  iconName,
  index,
  href,
}: AnimatedActionCardProps) {
  const Icon = iconMap[iconName];
  
  const content = (
    <>
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      <div className="absolute bottom-6 right-6 opacity-0 transition-opacity transform translate-x-3 group-hover:opacity-100 group-hover:translate-x-0">
        <ArrowRight className="h-5 w-5 text-primary" />
      </div>
    </>
  );

  const className = "group relative flex h-full flex-col rounded-xl bg-card p-6 shadow-sm border border-border backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/50";

  if (href) {
    return (
      <motion.a
        href={href}
        className={className}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 + 0.3 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 + 0.3 }}
    >
      {content}
    </motion.div>
  );
}
