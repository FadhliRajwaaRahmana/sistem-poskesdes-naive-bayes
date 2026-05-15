"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { ToastNotifier } from "@/components/ui/toast-notifier";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{ ease: "easeOut", duration: 0.4 }}
    >
      <Suspense>
        <ToastNotifier />
      </Suspense>
      {children}
    </motion.div>
  );
}
