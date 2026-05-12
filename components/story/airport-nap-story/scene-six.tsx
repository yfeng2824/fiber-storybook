"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { paymentExample, SCENE_SIX_END_SECONDS, SCENE_SIX_START_SECONDS } from "@/lib/story-content";
import { useSound } from "@/components/providers/sound-provider";
import { FiberNapAvatarNode, PicoAvatarNode, cx } from "../shared";
import { beatProgress, easeInOutSine, formatCkb, formatSceneSixDuration, progressAtBeat } from "../shared";
import styles from "./scene-six.module.css";
import motionStyles from "./scene-six-motion.module.css";

const SCENE_SIX_TIMELINE_BEATS = 8;
const SCENE_SIX_CIRCLE_REVEAL_BEATS = 2;
export { SCENE_SIX_END_SECONDS, SCENE_SIX_START_SECONDS };

export function MicropaymentsSceneContent({
  progress,
  sceneSixStartSeconds,
  sceneSixEndSeconds,
  isSceneActive,
  onSessionSnapshot,
  onRelease,
}: {
  progress: number;
  sceneSixStartSeconds: number;
  sceneSixEndSeconds: number;
  isSceneActive: boolean;
  onSessionSnapshot?: (snapshot: {
    elapsedSeconds: number;
    paid: number;
    remaining: number;
    ratePerSecond: number;
  }) => void;
  onRelease?: () => void;
}) {
  const [elapsedOffset, setElapsedOffset] = useState(0);
  const [isReleased, setIsReleased] = useState(false);
  const [wakeStarted, setWakeStarted] = useState(false);
  const [wakeStage, setWakeStage] = useState<"sleeping" | "half" | "awake">("sleeping");
  const [cardWidth, setCardWidth] = useState<number | null>(null);
  const elapsedCardRef = useRef<HTMLDivElement | null>(null);
  const paidCardRef = useRef<HTMLDivElement | null>(null);
  const wakeTimersRef = useRef<number[]>([]);
  const touchStartYRef = useRef<number | null>(null);
  const autoReleaseFiredRef = useRef(false);
  const { playCue, setSoundscape } = useSound();
  const roosterLeadMs = 900;
  const sceneSixMaxOffset = sceneSixEndSeconds - sceneSixStartSeconds;
  const startThreshold = progressAtBeat(SCENE_SIX_CIRCLE_REVEAL_BEATS, SCENE_SIX_TIMELINE_BEATS);
  const resetThreshold = progressAtBeat(0.15, SCENE_SIX_TIMELINE_BEATS);
  const hasStarted = progress > startThreshold;

  const clearWakeTimers = () => {
    wakeTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    wakeTimersRef.current = [];
  };

  useEffect(() => {
    if (progress < resetThreshold) {
      setElapsedOffset(0);
      setIsReleased(false);
      setWakeStarted(false);
      setWakeStage("sleeping");
      autoReleaseFiredRef.current = false;
      clearWakeTimers();
    }
  }, [progress]);

  useEffect(() => () => {
    clearWakeTimers();
  }, []);

  const startWakeSequence = () => {
    if (wakeStarted) {
      return;
    }

    setWakeStarted(true);
    setWakeStage("sleeping");
    playCue("scene.rooster-wakeup");

    clearWakeTimers();
    wakeTimersRef.current = [
      window.setTimeout(() => {
        setSoundscape("quiet");
      }, roosterLeadMs),
      window.setTimeout(() => {
        setWakeStage("half");
      }, roosterLeadMs),
      window.setTimeout(() => {
        setWakeStage("awake");
      }, roosterLeadMs + 520),
      window.setTimeout(() => {
        setIsReleased(true);
      }, roosterLeadMs + 900),
    ];
  };

  useEffect(() => {
    if (!hasStarted || wakeStarted || elapsedOffset >= sceneSixMaxOffset) {
      return;
    }

    const timer = window.setTimeout(() => {
      setElapsedOffset((current) => Math.min(current + 1, sceneSixMaxOffset));
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [elapsedOffset, hasStarted, sceneSixMaxOffset, wakeStarted]);

  useEffect(() => {
    if (elapsedOffset >= sceneSixMaxOffset) {
      startWakeSequence();
    }
  }, [elapsedOffset, sceneSixMaxOffset]);

  useEffect(() => {
    if (!isReleased || autoReleaseFiredRef.current) {
      return;
    }

    autoReleaseFiredRef.current = true;
    onRelease?.();
  }, [isReleased, onRelease]);

  useEffect(() => {
    if (isSceneActive && hasStarted && !wakeStarted) {
      setSoundscape("sleep");
      return;
    }

    if (!isSceneActive) {
      setSoundscape("airport");
    }
  }, [hasStarted, isSceneActive, setSoundscape, wakeStarted]);

  useLayoutEffect(() => {
    const nextWidth = Math.max(360, elapsedCardRef.current?.scrollWidth ?? 0, paidCardRef.current?.scrollWidth ?? 0);

    if (nextWidth > 0 && nextWidth !== cardWidth) {
      setCardWidth(nextWidth);
    }
  }, [cardWidth, elapsedOffset]);

  useEffect(() => {
    if (!isSceneActive || !hasStarted || isReleased) {
      return undefined;
    }

    // The sleep stage is state-gated: users may scroll back up, but downward
    // navigation is blocked until the timer finishes or the wake button runs.
    const preventDownwardWheel = (event: WheelEvent) => {
      if (event.deltaY > 0) {
        event.preventDefault();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const preventDownwardTouchMove = (event: TouchEvent) => {
      const touchStartY = touchStartYRef.current;
      const touchCurrentY = event.touches[0]?.clientY;

      if (touchStartY == null || touchCurrentY == null) {
        return;
      }

      if (touchCurrentY < touchStartY) {
        event.preventDefault();
      }
    };

    const preventDownwardKeys = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "End" ||
        event.key === " " ||
        event.key === "Spacebar"
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", preventDownwardWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", preventDownwardTouchMove, { passive: false });
    window.addEventListener("keydown", preventDownwardKeys);

    return () => {
      touchStartYRef.current = null;
      window.removeEventListener("wheel", preventDownwardWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", preventDownwardTouchMove);
      window.removeEventListener("keydown", preventDownwardKeys);
    };
  }, [hasStarted, isReleased, isSceneActive]);

  const entryReveal = easeInOutSine(
    beatProgress(progress, 0, SCENE_SIX_CIRCLE_REVEAL_BEATS, SCENE_SIX_TIMELINE_BEATS),
  );
  const elapsedSeconds = sceneSixStartSeconds + elapsedOffset;
  const paid = elapsedSeconds * paymentExample.ratePerSecond;
  const remaining = paymentExample.deposit - paid;
  const paidPercent = (paid / paymentExample.deposit) * 100;
  const zzzOpacity = wakeStarted ? 0 : 1;
  const buttonReveal = wakeStarted ? 0 : 1;
  const sceneClassName = wakeStarted
    ? wakeStage === "awake"
      ? cx(styles.scene, styles.sceneWake, styles.sceneWakeComplete)
      : cx(styles.scene, styles.sceneWake)
    : styles.scene;

  useEffect(() => {
    onSessionSnapshot?.({
      elapsedSeconds,
      paid,
      remaining,
      ratePerSecond: paymentExample.ratePerSecond,
    });
  }, [elapsedSeconds, onSessionSnapshot, paid, remaining]);

  return (
    <div className={sceneClassName}>
      <div
        className={styles.surfaceReveal}
        style={{ clipPath: `circle(${entryReveal * 150}% at 50% 50%)` }}
      >
        <div className={styles.surface}>
          <div
            className={styles.network}
            style={{
              opacity: 1,
              transform: "translateY(0)",
            }}
          >
            <PicoAvatarNode
              className={cx(styles.node, styles.nodeLeft)}
              statusClassName={styles.nodeStatus}
              dotClassName={styles.nodeDot}
              avatarClassName={styles.nodeAvatar}
              imageClassName={styles.nodeAvatarImage}
              nameClassName={styles.nodeLabel}
            />

            <FiberNapAvatarNode
              className={cx(styles.node, styles.nodeRight)}
              statusClassName={styles.nodeStatus}
              dotClassName={styles.nodeDot}
              avatarClassName={styles.nodeAvatar}
              imageClassName={styles.nodeAvatarImage}
              nameClassName={styles.nodeLabel}
            />

            <div className={styles.connector} aria-hidden="true" />

            <div className={styles.channelPill}>
              <span>Payment Channel (Layer 2)</span>
            </div>

            <p className={styles.channelCopy}>Micropayments off-chain</p>

            <div className={styles.distribution}>
              <div className={styles.distributionBar}>
                <div className={styles.distributionRemaining} style={{ width: `${100 - paidPercent}%` }} />
                <div className={styles.distributionPaid} style={{ width: `${paidPercent}%` }} />
                <div
                  className={styles.distributionDivider}
                  aria-hidden="true"
                  style={{ left: `${100 - paidPercent}%` }}
                />
                <p className={styles.distributionTotal}>Total: {formatCkb(paymentExample.deposit)} CKB</p>
              </div>

              <div className={styles.distributionValues}>
                <span>{formatCkb(remaining)} CKB</span>
                <span>{formatCkb(paid)} CKB</span>
              </div>
            </div>
          </div>

          <div
            className={styles.stats}
            style={{
              opacity: 1,
              transform: "translateX(-50%) translateY(0)",
            }}
          >
            <div className={styles.cards}>
              <div ref={elapsedCardRef} className={styles.card} style={cardWidth ? { width: `${cardWidth}px` } : undefined}>
                <p className={styles.cardLabel}>Elapsed time</p>
                <strong className={styles.cardValue}>{formatSceneSixDuration(elapsedSeconds)}</strong>
              </div>

              <div ref={paidCardRef} className={styles.card} style={cardWidth ? { width: `${cardWidth}px` } : undefined}>
                <p className={styles.cardLabel}>Paid by Pico</p>
                <strong className={styles.cardValue}>{formatCkb(paid)} CKB</strong>
              </div>
            </div>

            <div className={styles.meta}>
              <div className={cx(styles.metaItem, styles.metaItemRight)}>
                <span>Usage rate:</span>
                <strong>{formatCkb(paymentExample.ratePerSecond)} CKB / sec</strong>
              </div>

              <div className={styles.metaItem}>
                <span>Remaining:</span>
                <strong>{formatCkb(remaining)} CKB</strong>
              </div>
            </div>
          </div>

          <div
            className={motionStyles.buttonWrap}
            style={{
              opacity: buttonReveal,
              transform: `translateX(-50%) translateY(${wakeStarted ? 20 : 0}px)`,
            }}
          >
            <button
              type="button"
              className={motionStyles.button}
              onMouseEnter={() => playCue("ui.pop")}
              onClick={startWakeSequence}
            >
              <span data-label="Wake up">Wake up</span>
            </button>
          </div>

          <div
            className={cx(
              motionStyles.picoStage,
              motionStyles[`picoStage${wakeStage.charAt(0).toUpperCase()}${wakeStage.slice(1)}`],
            )}
            style={{
              opacity: 1,
              transform: "translateX(-50%) translateY(0)",
            }}
          >
            <img
              src="/chapter1/sleeping-pico.png"
              alt="Pico sleeping peacefully."
              className={cx(motionStyles.picoLayer, motionStyles.picoLayerSleeping)}
            />
            <img
              src="/chapter1/half-awake-pico.png"
              alt="Pico half awake."
              className={cx(motionStyles.picoLayer, motionStyles.picoLayerHalf)}
            />
            <img
              src="/chapter1/awake-pico.png"
              alt="Pico awake."
              className={cx(motionStyles.picoLayer, motionStyles.picoLayerAwake)}
            />
          </div>

          <div className={motionStyles.zzz} aria-hidden="true" style={{ opacity: zzzOpacity }}>
            <span className={cx(motionStyles.zzzLetter, motionStyles.zzzLetter1)}>Z</span>
            <span className={cx(motionStyles.zzzLetter, motionStyles.zzzLetter2)}>z</span>
            <span className={cx(motionStyles.zzzLetter, motionStyles.zzzLetter3)}>z</span>
          </div>

        </div>
      </div>
    </div>
  );
}
