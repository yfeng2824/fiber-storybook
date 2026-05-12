"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSound, type CueId } from "@/components/providers/sound-provider";
import { multiServiceDefaultSettlement, type SceneConfig } from "@/lib/story-content";
import {
  beatProgress,
  clamp01,
  CueWatcher,
  easeInOutSine,
  easeOutCubic,
  progressAtBeat,
  SceneShell,
  scrollToStoryScene,
  TwoPanelStoryboardScene,
  usePinnedSectionProgress,
  type TwoPanelStoryboardAssets,
} from "../shared";
import {
  MultiServiceActiveServicesContent,
  type MultiServiceSettlementSnapshot,
} from "./multi-service-active-services-scene";
import {
  MultiServiceChannelBoard,
  MultiServiceChannelScene,
  MultiServicePaymentRouteScene,
  MultiServiceRouteDistributionBoard,
  MultiServiceSettlementScene,
} from "./multi-service-channel-scene";
import { MultiServiceFinalSummaryScene } from "./multi-service-final-summary-scene";
import styles from "./multi-service-story.module.css";

const MULTI_SERVICE_TEXT_SCENE_BEATS = 4;
const MULTI_SERVICE_SCENE_TWO_BEATS = 5;
const ACTIVE_SCENE_GATE_PROGRESS = 0.995;
const CHAPTER_TWO_SCENE_TWO_STORYBOARDS = [
  { src: "/chapter2/c2-storyboard-2-start.svg", alt: "Airport service choices before Pico compares approvals." },
  { src: "/chapter2/c2-storyboard-2-mid.svg", alt: "Airport service choices while Pico compares repeated approvals." },
  { src: "/chapter2/c2-storyboard-2-end.svg", alt: "Airport service choices after Pico sees repeated approvals." },
] as const;
const CHAPTER_TWO_HEARTS = [
  { positionClassName: "heartLeftHigh", sizeClassName: "heartSmall", delay: 0.02, left: 16, top: 29 },
  { positionClassName: "heartLeftMid", sizeClassName: "heartLarge", delay: 0.1, left: 11, top: 52 },
  { positionClassName: "heartLeftLow", sizeClassName: "heartMedium", delay: 0.18, left: 18, top: 82 },
  { positionClassName: "heartRightHigh", sizeClassName: "heartMedium", delay: 0.26, left: 84, top: 55 },
  { positionClassName: "heartRightMid", sizeClassName: "heartLarge", delay: 0.34, left: 90, top: 67 },
  { positionClassName: "heartRightLow", sizeClassName: "heartSmall", delay: 0.42, left: 94, top: 82 },
] as const;

export function MultiServiceStory({
  scenes,
  activeSceneId,
  onActiveChange,
}: {
  scenes: SceneConfig[];
  activeSceneId: string;
  onActiveChange: (id: string) => void;
}) {
  const [settlementSnapshot, setSettlementSnapshot] = useState<MultiServiceSettlementSnapshot>(
    multiServiceDefaultSettlement,
  );

  return (
    <div className="relative w-full bg-[var(--color-bg-white)]">
      <ChapterBanner />
      <MultiServiceTextScene
        scene={scenes[0]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        footerLines={1}
      />
      <MultiServiceTextScene
        scene={scenes[1]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        footerLines={1}
      />
      <MultiServiceTextScene
        scene={scenes[2]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        footerLines={2}
      />
      <MultiServiceActionScene
        scene={scenes[3]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        assets={{
          leftStart: "/chapter2/c2-storyboard-4-left-start.svg",
          leftStartAlt: "Multi-service start screen before Pico confirms.",
          leftEnd: "/chapter2/c2-storyboard-4-left-end.svg",
          leftEndAlt: "Multi-service start screen after Pico confirms.",
          rightStart: "/chapter2/c2-storyboard-4-right.svg",
          rightStartAlt: "Phone confirmation for multiple supported services and assets.",
        }}
      />
      <MultiServiceChannelScene
        scene={scenes[4]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
      />
      <MultiServiceTextScene
        scene={scenes[5]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        footerLines={0}
      />
      <MultiServiceActionScene
        scene={scenes[6]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        rightSwapCue="pod.door-close"
        assets={{
          leftStart: "/chapter2/c2-storyboard-7-left-start.svg",
          leftStartAlt: "Luggage storage phone screen before Pico confirms.",
          leftEnd: "/chapter2/c2-storyboard-7-left-end.svg",
          leftEndAlt: "Luggage storage phone screen after Pico confirms.",
          rightStart: "/chapter2/c2-storyboard-7-right-start.svg",
          rightStartAlt: "Luggage storage service panel before payment completes.",
          rightEnd: "/chapter2/c2-storyboard-7-right-end.svg",
          rightEndAlt: "Luggage storage service panel after payment completes.",
        }}
      />
      <MultiServicePaymentRouteScene
        scene={scenes[7]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
      />
      <MultiServiceTextScene
        scene={scenes[8]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        footerLines={1}
      />
      <MultiServiceActionScene
        scene={scenes[9]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        assets={{
          leftStart: "/chapter2/c2-storyboard-10-left-start.svg",
          leftStartAlt: "Massage chair phone screen before Pico confirms.",
          leftEnd: "/chapter2/c2-storyboard-10-left-end.svg",
          leftEndAlt: "Massage chair phone screen after Pico confirms.",
          rightStart: "/chapter2/c2-storyboard-10-right.svg",
          rightStartAlt: "Massage chair service confirmation panel.",
        }}
      />
      <MultiServiceRouteActiveSection
        routeScene={scenes[10]}
        activeScene={scenes[11]}
        settlementScene={scenes[12]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        onSettlementChange={setSettlementSnapshot}
      />
      <MultiServiceSettlementScene
        scene={scenes[12]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        settlement={settlementSnapshot}
      />
      <MultiServiceFinalSummaryScene
        scene={scenes[13]}
        activeSceneId={activeSceneId}
        onActiveChange={onActiveChange}
        settlement={settlementSnapshot}
      />
    </div>
  );
}

function MultiServiceRouteActiveSection({
  routeScene,
  activeScene,
  settlementScene,
  activeSceneId,
  onActiveChange,
  onSettlementChange,
}: {
  routeScene: SceneConfig;
  activeScene: SceneConfig;
  settlementScene: SceneConfig;
  activeSceneId: string;
  onActiveChange: (id: string) => void;
  onSettlementChange: (snapshot: MultiServiceSettlementSnapshot) => void;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const lastReportedSceneRef = useRef(activeSceneId);
  const activeSceneReleasedRef = useRef(false);
  const routeScrollBudget = routeScene.scrollLength - 100;
  const activeScrollBudget = activeScene.scrollLength - 100;
  const combinedScrollBudget = routeScrollBudget + activeScrollBudget;
  const routeShare = routeScrollBudget / combinedScrollBudget;
  const routeProgress = clamp01(progress / routeShare);
  const activeProgress = clamp01((progress - routeShare) / (1 - routeShare));
  const gatedMaxProgress = routeShare + (1 - routeShare) * ACTIVE_SCENE_GATE_PROGRESS;
  const activeReveal = easeInOutSine(clamp01(activeProgress / 0.18));
  const activeClipRadius = activeReveal * 150;
  const reopenActiveScene = () => {
    setProgress(gatedMaxProgress);

    if (lastReportedSceneRef.current !== activeScene.id) {
      lastReportedSceneRef.current = activeScene.id;
      onActiveChange(activeScene.id);
    }
  };

  usePinnedSectionProgress({
    sectionRef,
    scrollBudgetVh: combinedScrollBudget,
    onEnterBack: reopenActiveScene,
    onProgress: (nextProgress, self) => {
      if (!activeSceneReleasedRef.current && nextProgress > gatedMaxProgress) {
        const clampedScroll = self.start + (self.end - self.start) * gatedMaxProgress;
        self.scroll(clampedScroll);
        setProgress(gatedMaxProgress);

        if (lastReportedSceneRef.current !== activeScene.id) {
          lastReportedSceneRef.current = activeScene.id;
          onActiveChange(activeScene.id);
        }

        return;
      }

      const nextSceneId = nextProgress < routeShare ? routeScene.id : activeScene.id;
      setProgress(nextProgress);

      if (nextProgress > 0.02 && nextProgress < 0.98 && lastReportedSceneRef.current !== nextSceneId) {
        lastReportedSceneRef.current = nextSceneId;
        onActiveChange(nextSceneId);
      }
    },
    dependencies: [
      activeScene.id,
      activeScene.scrollLength,
      combinedScrollBudget,
      gatedMaxProgress,
      onActiveChange,
      routeScene.id,
      routeShare,
    ],
  });

  useEffect(() => {
    lastReportedSceneRef.current = activeSceneId;
  }, [activeSceneId]);

  const handleRelease = () => {
    activeSceneReleasedRef.current = true;
    setProgress(1);
    window.requestAnimationFrame(() => {
      scrollToStoryScene(settlementScene.id, { durationMs: 500 });
    });
  };

  const handleReleaseStateChange = (isReleased: boolean) => {
    activeSceneReleasedRef.current = isReleased;
  };

  return (
    <section
      id={routeScene.id}
      ref={sectionRef}
      className="story-scene"
      style={{ minHeight: "100vh", background: "var(--color-bg-yellow)" }}
    >
      <div className="story-stage" style={{ background: "var(--color-bg-yellow)" }}>
        <div className={styles.technicalTransitionStage}>
          <div className={styles.technicalBaseLayer}>
            <MultiServiceRouteDistributionBoard
              routeVariant="massage"
              progress={routeProgress}
              isActive={activeSceneId === routeScene.id || (routeProgress > 0.04 && routeProgress < 0.98)}
            />
          </div>

          <div
            id={activeScene.id}
            className={styles.activeServicesRevealLayer}
            style={{
              clipPath: `circle(${activeClipRadius}% at 50% 50%)`,
              pointerEvents: activeReveal > 0.95 ? "auto" : "none",
            }}
          >
            <MultiServiceActiveServicesContent
              scene={activeScene}
              progress={activeProgress}
              isSceneActive={activeSceneId === activeScene.id || (activeProgress > 0 && activeProgress < 1)}
              onSettlementChange={onSettlementChange}
              onRelease={handleRelease}
              onReleaseStateChange={handleReleaseStateChange}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ChapterBanner() {
  return (
    <section
      id="chapter-2"
      className="grid min-h-[289px] w-full content-center justify-items-center gap-6 bg-[var(--color-yellow)] px-6 py-16 text-center text-[var(--color-text-primary)]"
      aria-label="Chapter banner"
    >
      <p className="m-0 text-[clamp(32px,3.125vw,40px)] leading-none font-bold [font-family:var(--font-chalk),var(--font-chalk-fallback)]">
        Chapter 2
      </p>
      <h2 className="m-0 text-[clamp(42px,4.375vw,56px)] leading-[1.15] font-bold [font-family:var(--font-chalk),var(--font-chalk-fallback)]">
        How payment works across services
      </h2>
    </section>
  );
}

function MultiServiceTextScene({
  scene,
  activeSceneId,
  onActiveChange,
  footerLines,
}: {
  scene: SceneConfig;
  activeSceneId: string;
  onActiveChange: (id: string) => void;
  footerLines: 0 | 1 | 2;
}) {
  return (
    <SceneShell
      scene={scene}
      activeSceneId={activeSceneId}
      onActiveChange={onActiveChange}
      stageStyle={() => ({ background: "var(--color-bg-white)" })}
    >
      {(progress) => {
        const totalBeats = scene.id === "chapter-2-scene-2" ? MULTI_SERVICE_SCENE_TWO_BEATS : MULTI_SERVICE_TEXT_SCENE_BEATS;
        const headlineReveal = easeOutCubic(beatProgress(progress, 0, 1, totalBeats));
        const boardReveal = easeOutCubic(beatProgress(progress, 1, 1, totalBeats));
        const footerOneReveal = easeOutCubic(beatProgress(progress, scene.id === "chapter-2-scene-2" ? 4 : 2, 1, totalBeats));
        const footerTwoReveal = easeOutCubic(beatProgress(progress, 3, 1, totalBeats));
        const heartsProgress = beatProgress(progress, 3, 1, totalBeats);
        const sceneTwoMidReveal = easeOutCubic(beatProgress(progress, 2, 0.55, totalBeats));
        const sceneTwoEndReveal = easeOutCubic(beatProgress(progress, 3.3, 0.55, totalBeats));

        return (
          <>
            {scene.id === "chapter-2-scene-2" ? (
              <CueWatcher
                progress={progress}
                cue="scene.hmmmm"
                threshold={progressAtBeat(3.3, totalBeats)}
                resetThreshold={progressAtBeat(3, totalBeats)}
              />
            ) : null}
            <MultiServiceSceneFrame
              scene={scene}
              topStyle={{
                opacity: headlineReveal,
                transform: `translateY(${(1 - headlineReveal) * 24}px)`,
              }}
              imageStyle={{
                opacity: boardReveal,
                transform: `translateY(${(1 - boardReveal) * 28}px) scale(${0.96 + boardReveal * 0.04})`,
              }}
              footerLineOneStyle={{
                opacity: footerLines > 0 ? footerOneReveal : 0,
                transform: `translateY(${(1 - footerOneReveal) * 18}px)`,
              }}
              footerLineTwoStyle={{
                opacity: footerLines === 2 ? footerTwoReveal : 0,
                transform: `translateY(${(1 - footerTwoReveal) * 18}px)`,
              }}
              footerLines={footerLines}
              heartsProgress={scene.id === "chapter-2-scene-3" ? heartsProgress : 0}
              showHearts={scene.id === "chapter-2-scene-3"}
              sequenceImages={
                scene.id === "chapter-2-scene-2"
                  ? [
                      { ...CHAPTER_TWO_SCENE_TWO_STORYBOARDS[1], opacity: sceneTwoMidReveal },
                      { ...CHAPTER_TWO_SCENE_TWO_STORYBOARDS[2], opacity: sceneTwoEndReveal },
                    ]
                  : undefined
              }
            />
          </>
        );
      }}
    </SceneShell>
  );
}

function MultiServiceSceneFrame({
  scene,
  topStyle,
  imageStyle,
  footerLineOneStyle,
  footerLineTwoStyle,
  footerLines,
  heartsProgress,
  showHearts,
  sequenceImages,
}: {
  scene: SceneConfig;
  topStyle: CSSProperties;
  imageStyle: CSSProperties;
  footerLineOneStyle: CSSProperties;
  footerLineTwoStyle: CSSProperties;
  footerLines: 0 | 1 | 2;
  heartsProgress: number;
  showHearts: boolean;
  sequenceImages?: readonly { src: string; alt: string; opacity: number }[];
}) {
  const heartCueStateRef = useRef<boolean[]>([]);
  const { playCue } = useSound();

  useEffect(() => {
    if (!showHearts) {
      heartCueStateRef.current = [];
      return;
    }

    CHAPTER_TWO_HEARTS.forEach((heart, index) => {
      const hasTriggered = heartCueStateRef.current[index] ?? false;

      if (!hasTriggered && heartsProgress >= heart.delay) {
        playCue("scene.heart-pop");
        heartCueStateRef.current[index] = true;
      } else if (hasTriggered && heartsProgress <= Math.max(0, heart.delay - 0.08)) {
        heartCueStateRef.current[index] = false;
      }
    });
  }, [heartsProgress, playCue, showHearts]);

  return (
    <div className={styles.scene}>
      <p className={styles.lead} style={topStyle}>
        {scene.copy.headline}
      </p>

      <div className={styles.board} style={imageStyle}>
        <div className={styles.boardFrame}>
          <Image src={scene.asset} alt={scene.assetAlt} fill className={styles.boardImage} />
          {sequenceImages?.map((image) => (
            <Image
              key={image.src}
              src={image.src}
              alt={image.alt}
              fill
              className={styles.boardImage}
              style={{ opacity: image.opacity }}
            />
          ))}
        </div>
      </div>

      {footerLines > 0 ? (
        <div className={[styles.footer, scene.id === "chapter-2-scene-3" ? styles.sceneThreeFooter : undefined].filter(Boolean).join(" ")}>
          <p className={scene.id === "chapter-2-scene-3" ? styles.sceneThreeFooterPrimary : undefined} style={footerLineOneStyle}>
            {scene.copy.body}
          </p>
          {footerLines === 2 ? <p style={footerLineTwoStyle}>{scene.copy.caption}</p> : null}
        </div>
      ) : null}

      {showHearts ? (
        <div className={styles.hearts} aria-hidden="true">
          {CHAPTER_TWO_HEARTS.map((heart) => {
            const local = clamp01((heartsProgress - heart.delay) / 0.28);

            return (
              <div
                key={`${heart.positionClassName}-${heart.sizeClassName}`}
                className={[styles.heart, styles[heart.positionClassName], styles[heart.sizeClassName]]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  left: `${heart.left}%`,
                  top: `${heart.top}%`,
                  opacity: local,
                  transform: `translate(-50%, -50%) translate(${(1 - local) * (50 - heart.left)}vw, ${
                    (1 - local) * (100 - heart.top)
                  }vh) scale(${0.28 + local * 0.72})`,
                }}
              >
                <Image src="/chapter1/heart.svg" alt="" width={48} height={44} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MultiServiceActionScene(props: {
  scene: SceneConfig;
  activeSceneId: string;
  onActiveChange: (id: string) => void;
  assets: TwoPanelStoryboardAssets;
  rightSwapCue?: CueId;
}) {
  return <TwoPanelStoryboardScene {...props} leftSwapCue="ui.pop" />;
}
