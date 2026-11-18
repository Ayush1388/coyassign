"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef } from "react";

/**
 * Bottom sheet (phone) / centred panel (desktop). Esc and backdrop close it,
 * focus moves in on open and returns on close, and the body doesn't scroll behind.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testId?: string;
}) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/45" />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            data-testid={testId}
            className="relative flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-[28px] bg-surface shadow-[0_-12px_40px_-12px_rgba(21,18,29,0.35)] outline-none sm:rounded-[28px]"
            initial={reduce ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.18, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
              <span aria-hidden className="absolute top-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-hairline sm:hidden" />
              <h2 id={titleId} className="display mt-2 text-[24px]">
                {title}
              </h2>
              <button type="button" onClick={onClose} aria-label="Close" className="btn-soft focus-ring mt-2">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
            {footer && (
              <div className="border-t border-hairline px-5 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))]">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
