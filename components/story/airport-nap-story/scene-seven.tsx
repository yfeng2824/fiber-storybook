"use client";

import Image from "next/image";
import { formatCkb, formatSceneSixDuration, PhoneSummaryPanel } from "../shared";
import styles from "./scene-seven.module.css";

export function SceneSevenPreviewSurface({
  leftReveal,
  leftEndReveal,
  rightReveal,
  paid,
  remaining,
  elapsedSeconds,
  ratePerSecond,
}: {
  leftReveal: number;
  leftEndReveal: number;
  rightReveal: number;
  paid: number;
  remaining: number;
  elapsedSeconds: number;
  ratePerSecond: number;
}) {
  return (
    <div className={styles.scene}>
      <div
        className={`${styles.panel} ${styles.leftPanel}`}
        style={{
          opacity: leftReveal,
          clipPath: `inset(0 0 ${(1 - leftReveal) * 100}% 0 round 8px)`,
          transform: `translateY(${-80 * (1 - leftReveal)}px)`,
          transition:
            "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), clip-path 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <Image src="/chapter1/c1-storyboard-8-left-start.svg" alt="" fill className={styles.image} />
        <Image
          src="/chapter1/c1-storyboard-8-left-end.svg"
          alt=""
          fill
          className={styles.image}
          style={{ opacity: leftEndReveal }}
        />
      </div>

      <div
        className={`${styles.panel} ${styles.rightPanel}`}
        style={{
          opacity: rightReveal,
          clipPath: `inset(${(1 - rightReveal) * 100}% 0 0 0 round 8px)`,
          transform: `translateY(${80 * (1 - rightReveal)}px)`,
          transition:
            "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), clip-path 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <PhoneSummaryPanel
          ariaLabel="Session totals"
          classes={{
            phoneStoryboard: styles.phoneStoryboard,
            phoneStage: styles.phoneStage,
            phoneShell: styles.phoneShell,
            phoneTopbar: styles.phoneTopbar,
            phoneDot: styles.phoneDot,
            phoneSpeaker: styles.phoneSpeaker,
            phoneScreen: styles.phoneScreen,
            badge: styles.sessionBadge,
            badgeArt: styles.sessionBadgeArt,
            badgeImage: styles.sessionBadgeLogo,
            title: styles.sessionTitle,
            summaryCard: styles.summaryCard,
            summaryLabel: styles.summaryLabel,
            summaryValue: styles.summaryValue,
            doneButton: styles.doneButton,
          }}
          badge={{ src: "/chapter1/nap-logo.svg", alt: "logo of fiber nap" }}
          title="Fiber Session Ended"
          cards={[
            {
              label: "Total paid",
              value: `${formatCkb(paid)} CKB`,
              className: styles.summaryCardPaid,
            },
            {
              label: "Unused balance returned",
              value: `${formatCkb(remaining)} CKB`,
              className: styles.summaryCardReturned,
            },
          ]}
        >
          <div className={styles.secondaryInfo}>
            <div className={styles.secondaryItem}>
              <span className={styles.secondaryLabel}>Total time</span>
              <strong className={styles.secondaryValue}>{formatSceneSixDuration(elapsedSeconds)}</strong>
            </div>

            <div className={styles.secondaryItem}>
              <span className={styles.secondaryLabel}>Usage rate</span>
              <strong className={styles.secondaryValue}>{formatCkb(ratePerSecond)} CKB / sec</strong>
            </div>
          </div>
        </PhoneSummaryPanel>
      </div>
    </div>
  );
}
