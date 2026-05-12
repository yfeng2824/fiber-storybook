"use client";

import Image from "next/image";
import { multiServiceServices, type MultiServiceKey, type SceneConfig } from "@/lib/story-content";
import {
  beatProgress,
  CueWatcher,
  easeOutCubic,
  formatCkb,
  PhoneSummaryPanel,
  progressAtBeat,
  SceneShell,
} from "../shared";
import type { MultiServiceSettlementSnapshot } from "./multi-service-active-services-scene";
import styles from "./multi-service-final-summary.module.css";

const FINAL_SUMMARY_TIMELINE_BEATS = 4;

const SUMMARY_ROWS = multiServiceServices.map((service) => ({
  key: service.key,
  label: service.name === "Luggage storage" ? "Luggage (CKB)" : "Massage (USD)",
}));
const serviceCkbRates = multiServiceServices.reduce<Record<MultiServiceKey, number>>(
  (rates, service) => ({
    ...rates,
    [service.key]: service.ckbEquivalentPerSecond,
  }),
  {} as Record<MultiServiceKey, number>,
);

export function MultiServiceFinalSummaryScene({
  scene,
  activeSceneId,
  onActiveChange,
  settlement,
}: {
  scene: SceneConfig;
  activeSceneId: string;
  onActiveChange: (id: string) => void;
  settlement: MultiServiceSettlementSnapshot;
}) {
  return (
    <SceneShell
      scene={scene}
      activeSceneId={activeSceneId}
      onActiveChange={onActiveChange}
      stageStyle={() => ({ background: "var(--color-bg-white)" })}
    >
      {(progress) => {
        const leftReveal = easeOutCubic(beatProgress(progress, 0, 1, FINAL_SUMMARY_TIMELINE_BEATS));
        const leftEndReveal = easeOutCubic(beatProgress(progress, 1, 1, FINAL_SUMMARY_TIMELINE_BEATS));
        const rightReveal = easeOutCubic(beatProgress(progress, 2, 1, FINAL_SUMMARY_TIMELINE_BEATS));

        return (
          <div className={styles.scene} aria-label={scene.name}>
            <CueWatcher
              progress={progress}
              cue="scene.phone-vibrate"
              threshold={progressAtBeat(1, FINAL_SUMMARY_TIMELINE_BEATS)}
              resetThreshold={0.08}
            />
            <div
              className={`${styles.panel} ${styles.leftPanel}`}
              style={{
                opacity: leftReveal,
                clipPath: `inset(0 0 ${(1 - leftReveal) * 100}% 0 round 8px)`,
                transform: `translateY(${-80 * (1 - leftReveal)}px)`,
              }}
            >
              <Image src="/chapter2/c2-storyboard-14-left-start.svg" alt={scene.assetAlt} fill className={styles.image} />
              <Image
                src="/chapter2/c2-storyboard-14-left-end.svg"
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
              }}
            >
              <AirportPassPhone settlement={settlement} />
            </div>
          </div>
        );
      }}
    </SceneShell>
  );
}

function AirportPassPhone({ settlement }: { settlement: MultiServiceSettlementSnapshot }) {
  return (
    <PhoneSummaryPanel
      ariaLabel="Fiber Airport Pass summary"
      classes={{
        phoneStoryboard: styles.phoneStoryboard,
        phoneStage: styles.phoneStage,
        phoneShell: styles.phoneShell,
        phoneTopbar: styles.phoneTopbar,
        phoneDot: styles.phoneDot,
        phoneSpeaker: styles.phoneSpeaker,
        phoneScreen: styles.phoneScreen,
        badge: styles.passBadge,
        badgeArt: styles.passBadgeArt,
        badgeImage: styles.passBadgeImage,
        title: styles.passTitle,
        summaryCard: styles.summaryCard,
        summaryLabel: styles.summaryLabel,
        summaryValue: styles.summaryValue,
        doneButton: styles.doneButton,
      }}
      badge={{ src: "/chapter2/fiber-pass-avatar.png", alt: "" }}
      title="Fiber Airport Pass"
      cards={[
        {
          label: "Total paid",
          value: `${formatCkb(settlement.used)} CKB`,
          className: styles.summaryCardPaid,
        },
        {
          label: "Unused balance returned",
          value: `${formatCkb(settlement.remaining)} CKB`,
          className: styles.summaryCardReturned,
        },
      ]}
    >
      <div className={styles.serviceSummary}>
        <div className={styles.serviceHeader}>
          <span>Service</span>
          <span>Time</span>
          <span>Paid</span>
        </div>
        <div className={styles.serviceRows}>
          {SUMMARY_ROWS.map((row) => {
            const seconds = settlement.serviceSeconds[row.key];
            const paid = seconds * serviceCkbRates[row.key];

            return (
              <div key={row.key} className={styles.serviceRow}>
                <span>{row.label}</span>
                <span>{seconds.toLocaleString("en-US")} sec</span>
                <span>{formatCkb(paid)} CKB</span>
              </div>
            );
          })}
        </div>
        <p className={styles.conversionNote}>1 CKB ≈ 0.1 USD</p>
      </div>
    </PhoneSummaryPanel>
  );
}
