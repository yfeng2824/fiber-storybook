"use client";

import { paymentExample } from "@/lib/story-content";
import { CueWatcher } from "../shared";
import { beatProgress, easeInOutSine, formatCkb, progressAtBeat } from "../shared";
import { FiberNapAvatarNode, LayerCardHeader, PicoAvatarNode, cx } from "../shared";
import styles from "./scene-five.module.css";

const SCENE_FIVE_TIMELINE_BEATS = 3;

export function OpeningChannelBoard({ progress }: { progress: number }) {
  const fillProgress = easeInOutSine(beatProgress(progress, 0, 1, SCENE_FIVE_TIMELINE_BEATS));
  const shiftProgress = easeInOutSine(beatProgress(progress, 1, 1, SCENE_FIVE_TIMELINE_BEATS));
  const activeReveal = easeInOutSine(beatProgress(progress, 2, 1, SCENE_FIVE_TIMELINE_BEATS));
  const activeShown = activeReveal > 0;
  const rowTop = 39.1826923077 + (61.0576923077 - 39.1826923077) * shiftProgress;

  return (
    <div className={styles.surface}>
      <h2 className={styles.title}>Fiber Behind the Scenes</h2>

      <div className={styles.network}>
        <PicoAvatarNode
          className={cx(styles.node, styles.nodeLeft)}
          statusClassName={styles.nodeStatus}
          dotClassName={styles.nodeDot}
          avatarClassName={styles.avatar}
          imageClassName={styles.avatarImage}
          nameClassName={styles.nodeName}
          style={{ top: `${rowTop}%` }}
        />

        <div className={styles.channelWrap} style={{ top: `${rowTop}%` }}>
          <div
            className={styles.fundingCard}
            style={{
              opacity: activeReveal,
              transform: `translateX(-50%) translateY(${18 * (1 - activeReveal)}px)`,
            }}
          >
            <LayerCardHeader
              className={styles.fundingHeader}
              iconClassName={styles.fundingIcon}
              label="Initial funding (Layer 1)"
            />
            <div className={styles.fundingBody}>
              <span className={styles.fundingKicker}>Total locked amount</span>
              <strong>{formatCkb(paymentExample.deposit)} CKB</strong>
            </div>
            <div className={styles.fundingDistribution}>
              <div className={styles.fundingBar} />
              <div className={styles.fundingLabels}>
                <span>{formatCkb(paymentExample.deposit)} CKB</span>
                <span>0 CKB</span>
              </div>
            </div>
          </div>

          <div className={styles.channelRow}>
            <div className={cx(styles.connectorSegment, styles.connectorSegmentLeft)} aria-hidden="true" />
            <div className={styles.channel}>
              <div className={styles.channelFill} style={{ width: `${fillProgress * 100}%` }} />
              <span className={styles.channelLabel}>Payment Channel (Layer 2)</span>
            </div>
            <div className={cx(styles.connectorSegment, styles.connectorSegmentRight)} aria-hidden="true" />
          </div>

          <div className={styles.status}>
            <span>Status:</span>
            <span className={styles.statusDetail}>
              <span
                className={styles.statusDot}
                style={{ background: activeShown ? "var(--color-status-active)" : "var(--color-status-opening)" }}
              />
              {activeShown ? "Active" : "Opening..."}
            </span>
          </div>
        </div>

        <FiberNapAvatarNode
          className={cx(styles.node, styles.nodeRight)}
          statusClassName={styles.nodeStatus}
          dotClassName={styles.nodeDot}
          avatarClassName={styles.avatar}
          imageClassName={styles.avatarImage}
          nameClassName={styles.nodeName}
          style={{ top: `${rowTop}%` }}
        />
      </div>

    </div>
  );
}

export function ChannelOpeningSceneContent({ progress }: { progress: number }) {
  return (
    <div className={styles.scene}>
      <CueWatcher
        progress={progress}
        cue="system.channel-active"
        threshold={progressAtBeat(2, SCENE_FIVE_TIMELINE_BEATS)}
        resetThreshold={progressAtBeat(1.5, SCENE_FIVE_TIMELINE_BEATS)}
      />
      <OpeningChannelBoard progress={progress} />
    </div>
  );
}
