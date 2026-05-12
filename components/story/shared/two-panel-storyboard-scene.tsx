"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { CueId } from "@/components/providers/sound-provider";
import type { SceneConfig } from "@/lib/story-content";
import { beatProgress, easeOutCubic, progressAtBeat } from "./motion";
import { CueWatcher, SceneShell } from "./scene-shell";
import styles from "./two-panel-storyboard.module.css";

const TWO_PANEL_BEATS = 4;

export type TwoPanelStoryboardAssets = {
  leftStart: string;
  leftStartAlt: string;
  leftEnd: string;
  leftEndAlt: string;
  rightStart: string;
  rightStartAlt: string;
  rightEnd?: string;
  rightEndAlt?: string;
};

export function TwoPanelStoryboardScene({
  scene,
  activeSceneId,
  onActiveChange,
  assets,
  stageStyle,
  leftSwapCue = "ui.tap-ding",
  rightSwapCue,
}: {
  scene: SceneConfig;
  activeSceneId: string;
  onActiveChange: (id: string) => void;
  assets: TwoPanelStoryboardAssets;
  stageStyle?: (progress: number) => CSSProperties;
  leftSwapCue?: CueId;
  rightSwapCue?: CueId;
}) {
  return (
    <SceneShell
      scene={scene}
      activeSceneId={activeSceneId}
      onActiveChange={onActiveChange}
      stageStyle={stageStyle ?? (() => ({ background: "var(--color-bg-white)" }))}
    >
      {(progress) => {
        const leftRevealRaw = beatProgress(progress, 0, 1, TWO_PANEL_BEATS);
        const leftSwapRaw = beatProgress(progress, 1, 1, TWO_PANEL_BEATS);
        const rightRevealRaw = beatProgress(progress, 2, 1, TWO_PANEL_BEATS);
        const rightSwapRaw = beatProgress(progress, 3, 1, TWO_PANEL_BEATS);
        const leftReveal = easeOutCubic(leftRevealRaw);
        const leftSwap = easeOutCubic(leftSwapRaw);
        const rightReveal = easeOutCubic(rightRevealRaw);
        const rightSwap = easeOutCubic(rightSwapRaw);
        const leftStyle = {
          opacity: leftReveal,
          clipPath: `inset(0 0 ${(1 - leftReveal) * 100}% 0 round 8px)`,
          transform: `translateY(${-80 * (1 - leftReveal)}px)`,
        };
        const rightStyle = {
          opacity: rightReveal,
          clipPath: `inset(${(1 - rightReveal) * 100}% 0 0 0 round 8px)`,
          transform: `translateY(${80 * (1 - rightReveal)}px)`,
        };

        return (
          <div className={styles.scene}>
            <CueWatcher
              progress={progress}
              cue={leftSwapCue}
              threshold={progressAtBeat(1, TWO_PANEL_BEATS)}
              resetThreshold={progressAtBeat(0.5, TWO_PANEL_BEATS)}
            />
            <CueWatcher
              progress={progress}
              cue="pod.door-open"
              threshold={progressAtBeat(2, TWO_PANEL_BEATS)}
              resetThreshold={progressAtBeat(1.5, TWO_PANEL_BEATS)}
            />
            {rightSwapCue && assets.rightEnd ? (
              <CueWatcher
                progress={progress}
                cue={rightSwapCue}
                threshold={progressAtBeat(3, TWO_PANEL_BEATS)}
                resetThreshold={progressAtBeat(2.5, TWO_PANEL_BEATS)}
              />
            ) : null}

            <div className={`${styles.panel} ${styles.leftPanel}`} style={leftStyle}>
              <div className={styles.panelStack}>
                <Image
                  src={assets.leftStart}
                  alt={assets.leftStartAlt}
                  fill
                  className={styles.image}
                  style={{ opacity: 1 - leftSwap }}
                />
                <Image
                  src={assets.leftEnd}
                  alt={assets.leftEndAlt}
                  fill
                  className={styles.image}
                  style={{ opacity: leftSwap }}
                />
              </div>
            </div>

            <div className={`${styles.panel} ${styles.rightPanel}`} style={rightStyle}>
              <div className={styles.panelStack}>
                <Image
                  src={assets.rightStart}
                  alt={assets.rightStartAlt}
                  fill
                  className={styles.image}
                  style={{ opacity: assets.rightEnd ? 1 - rightSwap : 1 }}
                />
                {assets.rightEnd ? (
                  <Image
                    src={assets.rightEnd}
                    alt={assets.rightEndAlt ?? assets.rightStartAlt}
                    fill
                    className={styles.image}
                    style={{ opacity: rightSwap }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        );
      }}
    </SceneShell>
  );
}
