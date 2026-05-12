"use client";

import type { SceneConfig } from "@/lib/story-content";
import { paymentExample } from "@/lib/story-content";
import { CueWatcher, SceneShell } from "../shared";
import { FiberNapAvatarNode, LayerCardHeader, PicoAvatarNode, cx } from "../shared";
import { beatProgress, easeOutCubic, formatCkb, progressAtBeat } from "../shared";
import styles from "./scene-eight.module.css";

const SCENE_EIGHT_TIMELINE_BEATS = 4;

export function SettlementScene({
  scene,
  activeSceneId,
  onActiveChange,
}: {
  scene: SceneConfig;
  activeSceneId: string;
  onActiveChange: (id: string) => void;
}) {
  return (
    <SceneShell
      scene={scene}
      activeSceneId={activeSceneId}
      onActiveChange={onActiveChange}
      stageStyle={() => ({ background: "var(--color-bg-yellow)" })}
    >
      {(progress) => {
        const transitionProgress = easeOutCubic(beatProgress(progress, 0, 2, SCENE_EIGHT_TIMELINE_BEATS));
        const connectorFade = 1 - easeOutCubic(beatProgress(progress, 1, 1, SCENE_EIGHT_TIMELINE_BEATS));
        const cardReveal = easeOutCubic(beatProgress(progress, 3, 1, SCENE_EIGHT_TIMELINE_BEATS));
        const statusShift = transitionProgress;
        const pillFillWidth = Math.max(0, 100 - statusShift * 100);
        const pillFillAlpha = Math.max(0, 0.82 - statusShift * 0.82);
        const rowTop = 61.0576923077;
        const statusDotClass = transitionProgress > 0.82 ? styles.statusDotClosed : styles.statusDotClosing;
        const returnedPercent = (paymentExample.returned / paymentExample.deposit) * 100;
        const paidPercent = (paymentExample.paid / paymentExample.deposit) * 100;

        return (
          <div className={styles.scene}>
            <CueWatcher
              progress={progress}
              cue="pod.door-close"
              threshold={progressAtBeat(0.5, SCENE_EIGHT_TIMELINE_BEATS)}
              resetThreshold={progressAtBeat(0.1, SCENE_EIGHT_TIMELINE_BEATS)}
            />
            <CueWatcher
              progress={progress}
              cue="system.disconnect"
              threshold={progressAtBeat(0.9, SCENE_EIGHT_TIMELINE_BEATS)}
              resetThreshold={progressAtBeat(0.3, SCENE_EIGHT_TIMELINE_BEATS)}
            />
            <CueWatcher
              progress={progress}
              cue="system.summary-chime"
              threshold={progressAtBeat(3, SCENE_EIGHT_TIMELINE_BEATS)}
              resetThreshold={progressAtBeat(2.5, SCENE_EIGHT_TIMELINE_BEATS)}
            />

            <div className={styles.surface}>
              <h2 className={styles.title}>Fiber Behind the Scenes</h2>

              <div className={styles.network}>
                <PicoAvatarNode
                  className={cx(styles.node, styles.nodeLeft)}
                  statusClassName={styles.nodeStatus}
                  dotClassName={styles.onlineDot}
                  avatarClassName={styles.avatar}
                  imageClassName={styles.avatarImage}
                  nameClassName={styles.nodeName}
                  style={{ top: `${rowTop}%` }}
                />

                <FiberNapAvatarNode
                  className={cx(styles.node, styles.nodeRight)}
                  statusClassName={styles.nodeStatus}
                  dotClassName={styles.onlineDot}
                  avatarClassName={styles.avatar}
                  imageClassName={styles.avatarImage}
                  nameClassName={styles.nodeName}
                  style={{ top: `${rowTop}%` }}
                />

                <div className={styles.channelWrap} style={{ top: `${rowTop}%` }}>
                  <div className={styles.connector} aria-hidden="true" style={{ opacity: connectorFade }} />

                  <div
                    className={styles.settlementCard}
                    style={{
                      opacity: cardReveal,
                      transform: `translateY(${(1 - cardReveal) * 20}px)`,
                    }}
                  >
                    <LayerCardHeader
                      className={styles.settlementHeader}
                      iconClassName={styles.settlementIcon}
                      label="Final settlement (Layer 1)"
                    />
                    <div className={styles.settlementBody}>
                      <span className={styles.settlementKicker}>Final distributed balance</span>
                    </div>
                    <div className={styles.settlementDistribution}>
                      <div
                        className={styles.settlementBar}
                        style={{
                          backgroundImage: `linear-gradient(90deg, var(--color-yellow-lighter) 0%, var(--color-yellow-lighter) ${returnedPercent}%, var(--color-yellow-darker) ${returnedPercent}%, var(--color-yellow-darker) ${returnedPercent + paidPercent}%)`,
                        }}
                      />
                      <div className={styles.settlementLabels}>
                        <div className={`${styles.settlementLabel} ${styles.settlementLabelLeft}`}>
                          <span className={styles.settlementAmount}>{formatCkb(paymentExample.returned)} CKB</span>
                          <span>Returned to Pico</span>
                        </div>
                        <div className={`${styles.settlementLabel} ${styles.settlementLabelRight}`}>
                          <span className={styles.settlementAmount}>{formatCkb(paymentExample.paid)} CKB</span>
                          <span>Paid to Fiber Nap</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={styles.channel}
                    style={{
                      backgroundImage:
                        pillFillWidth > 0.5
                          ? `linear-gradient(90deg, color-mix(in srgb, var(--color-status-closed) ${pillFillAlpha * 100}%, transparent) 0%, color-mix(in srgb, var(--color-status-closed) ${pillFillAlpha * 100}%, transparent) ${pillFillWidth}%, transparent ${Math.min(
                              100,
                              pillFillWidth + 1.2,
                            )}%, transparent 100%)`
                          : "none",
                    }}
                  >
                    <span className={styles.channelLabel}>Payment Channel (Layer 2)</span>
                  </div>

                  <div className={styles.status}>
                    <span>Status:</span>
                    <span className={styles.statusDetail}>
                      <span className={`${styles.statusDot} ${statusDotClass}`} />
                      {transitionProgress > 0.82 ? "Closed" : "Closing..."}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }}
    </SceneShell>
  );
}
