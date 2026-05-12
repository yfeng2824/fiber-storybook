"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MULTI_SERVICE_CKB_RATE_PER_SECOND,
  MULTI_SERVICE_ACTIVE_WINDOW_SECONDS,
  MULTI_SERVICE_END_REMAINING_CKB,
  MULTI_SERVICE_START_REMAINING_CKB,
  MULTI_SERVICE_TOTAL_CKB,
  multiServiceServices,
  type MultiServiceKey,
  type SceneConfig,
} from "@/lib/story-content";
import { MultiServiceChannelBoard } from "./multi-service-channel-scene";
import channelStyles from "./multi-service-channel.module.css";

export type MultiServiceSettlementSnapshot = {
  remaining: number;
  used: number;
  total: number;
  serviceSeconds: Record<MultiServiceKey, number>;
};

function ActiveServicesBoard({
  scene,
  progress,
  isSceneActive,
  onSettlementChange,
  onRelease,
  onReleaseStateChange,
  allowVisibilityActivation,
}: {
  scene: SceneConfig;
  progress: number;
  isSceneActive: boolean;
  onSettlementChange?: (snapshot: MultiServiceSettlementSnapshot) => void;
  onRelease?: () => void;
  onReleaseStateChange?: (isReleased: boolean) => void;
  allowVisibilityActivation: boolean;
}) {
  const [elapsedOffset, setElapsedOffset] = useState(0);
  const [isReleased, setIsReleased] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const autoReleaseFiredRef = useRef(false);
  const isInScene = isSceneActive || (allowVisibilityActivation && isVisible) || (progress > 0.04 && progress < 0.98);

  const remaining = Math.max(
    MULTI_SERVICE_END_REMAINING_CKB,
    MULTI_SERVICE_START_REMAINING_CKB - elapsedOffset * MULTI_SERVICE_CKB_RATE_PER_SECOND,
  );
  const used = MULTI_SERVICE_TOTAL_CKB - remaining;
  const serviceTimes = useMemo(
    () =>
      multiServiceServices.reduce<Record<MultiServiceKey, number>>(
        (times, service) => ({
          ...times,
          [service.key]: Math.min(service.endSeconds, service.startSeconds + elapsedOffset),
        }),
        {} as Record<MultiServiceKey, number>,
      ),
    [elapsedOffset],
  );

  const publishSettlement = (nextRemaining: number, nextServiceTimes = serviceTimes) => {
    onSettlementChange?.({
      remaining: nextRemaining,
      used: MULTI_SERVICE_TOTAL_CKB - nextRemaining,
      total: MULTI_SERVICE_TOTAL_CKB,
      serviceSeconds: nextServiceTimes,
    });
  };

  useEffect(() => {
    const sceneElement = sceneRef.current;

    if (!sceneElement) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.35));
      },
      { threshold: [0, 0.35, 0.7] },
    );

    observer.observe(sceneElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (progress < 0.03) {
      setElapsedOffset(0);
      setIsReleased(false);
      autoReleaseFiredRef.current = false;
    }
  }, [progress]);

  useEffect(() => {
    if (
      !isInScene ||
      isReleased ||
      elapsedOffset >= MULTI_SERVICE_ACTIVE_WINDOW_SECONDS ||
      remaining <= MULTI_SERVICE_END_REMAINING_CKB
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setElapsedOffset((current) => current + 1);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [elapsedOffset, isInScene, isReleased, remaining]);

  useEffect(() => {
    if (elapsedOffset >= MULTI_SERVICE_ACTIVE_WINDOW_SECONDS || remaining <= MULTI_SERVICE_END_REMAINING_CKB) {
      setIsReleased(true);
      publishSettlement(MULTI_SERVICE_END_REMAINING_CKB);
    }
  }, [elapsedOffset, remaining, onSettlementChange, serviceTimes]);

  useEffect(() => {
    onReleaseStateChange?.(isReleased);
  }, [isReleased, onReleaseStateChange]);

  useEffect(() => {
    if (!isReleased || autoReleaseFiredRef.current) {
      return;
    }

    autoReleaseFiredRef.current = true;
    onRelease?.();
  }, [isReleased, onRelease]);

  useEffect(() => {
    if (!isInScene || isReleased) {
      return undefined;
    }

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
  }, [isInScene, isReleased]);

  return (
    <div ref={sceneRef} className={channelStyles.scene} aria-label={scene.name}>
      <MultiServiceChannelBoard
        progress={progress}
        variant="active-services"
        activeServices={{
          remaining,
          used,
          total: MULTI_SERVICE_TOTAL_CKB,
          serviceSeconds: serviceTimes,
          onEndAllServices: () => {
            publishSettlement(remaining);
            setIsReleased(true);
          },
        }}
      />
    </div>
  );
}

export function MultiServiceActiveServicesContent({
  scene,
  progress,
  isSceneActive,
  onSettlementChange,
  onRelease,
  onReleaseStateChange,
  allowVisibilityActivation = false,
}: {
  scene: SceneConfig;
  progress: number;
  isSceneActive: boolean;
  onSettlementChange?: (snapshot: MultiServiceSettlementSnapshot) => void;
  onRelease?: () => void;
  onReleaseStateChange?: (isReleased: boolean) => void;
  allowVisibilityActivation?: boolean;
}) {
  return (
    <ActiveServicesBoard
      scene={scene}
      progress={progress}
      isSceneActive={isSceneActive}
      allowVisibilityActivation={allowVisibilityActivation}
      onSettlementChange={onSettlementChange}
      onRelease={onRelease}
      onReleaseStateChange={onReleaseStateChange}
    />
  );
}
