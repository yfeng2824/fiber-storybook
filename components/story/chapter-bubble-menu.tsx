"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useSound } from "@/components/providers/sound-provider";
import { scrollToStoryScene } from "./shared";
import styles from "./chapter-bubble-menu.module.css";

const chapterItems = [
  { id: "chapter-1", label: "Chapter 1" },
  { id: "chapter-2", label: "Chapter 2" },
] as const;

export function ChapterBubbleMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { playCue, suppressSceneCues } = useSound();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const closeButton = closeRef.current;
    const items = itemRefs.current.filter(Boolean);

    if (!overlay) {
      return;
    }

    const animatedElements = [overlay, closeButton, ...items].filter(Boolean);
    gsap.killTweensOf(animatedElements);

    if (isOpen) {
      gsap.set(overlay, { pointerEvents: "auto" });
      gsap.fromTo(
        overlay,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.22, ease: "power2.out" },
      );
      gsap.fromTo(
        [closeButton].filter(Boolean),
        { autoAlpha: 0, scale: 0.72, y: -20 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.32, ease: "back.out(1.7)", stagger: 0.04 },
      );
      gsap.fromTo(
        items,
        { autoAlpha: 0, scale: 0.5, y: 80, rotate: 0 },
        { autoAlpha: 1, scale: 1, y: 0, rotate: 0, duration: 0.46, ease: "elastic.out(1, 0.72)", stagger: 0.07, delay: 0.08 },
      );
      return;
    }

    gsap.to(items, { autoAlpha: 0, scale: 0.72, y: 32, duration: 0.16, ease: "power2.in", stagger: 0.025 });
    gsap.to([closeButton].filter(Boolean), { autoAlpha: 0, scale: 0.86, y: -12, duration: 0.14, ease: "power2.in" });
    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.2,
      ease: "power2.in",
      delay: 0.04,
      onComplete: () => {
        gsap.set(overlay, { pointerEvents: "none" });
      },
    });
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <nav className={styles.root} aria-label="Chapter navigation">
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-controls="chapter-bubble-overlay"
        onMouseEnter={() => playCue("ui.pop")}
        onClick={() => setIsOpen((current) => !current)}
      >
        Chapters
      </button>
      <div
        ref={overlayRef}
        id="chapter-bubble-overlay"
        className={styles.overlay}
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Chapter menu"
      >
        <button
          ref={closeRef}
          type="button"
          className={styles.closeButton}
          aria-label="Close chapters menu"
          tabIndex={isOpen ? 0 : -1}
          onMouseEnter={() => playCue("ui.pop")}
          onClick={() => setIsOpen(false)}
        >
          <span />
          <span />
        </button>
        <div className={styles.menu}>
          {chapterItems.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              className={styles.item}
              tabIndex={isOpen ? 0 : -1}
              onMouseEnter={() => playCue("ui.pop")}
              onClick={() => {
                suppressSceneCues();
                setIsOpen(false);
                window.setTimeout(() => scrollToStoryScene(item.id), 160);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
