"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSound } from "@/components/providers/sound-provider";
import type { SceneConfig } from "@/lib/story-content";
import { multiServiceServices, type MultiServiceKey } from "@/lib/story-content";
import { beatProgress, CueWatcher, cx, easeInOutSine, progressAtBeat, SceneShell } from "../shared";
import { formatCkb } from "../shared";
import type { MultiServiceSettlementSnapshot } from "./multi-service-active-services-scene";
import { BareAvatar, NodeStatus, ServiceNode } from "./multi-service-channel-nodes";
import channelStyles from "./multi-service-channel.module.css";
import storyStyles from "./multi-service-story.module.css";

const MULTI_SERVICE_CHANNEL_SCENE_BEATS = 3;
const MULTI_SERVICE_SETTLEMENT_SCENE_BEATS = 4;
const ROUTE_DISTRIBUTION_TICK_MS = 1000;

type PaymentRouteVariant = "luggage" | "massage";
type ChannelBoardVariant = "opening" | "settlement" | "active-services";
type RouteDistributionConfig = {
  serviceName: string;
  serviceAvatar: string;
  serviceAvatarAlt: string;
  serviceAccepts: string;
  sourceDistributionLabel: string;
  sourceChannelLabel: string;
  sourceTotal: number;
  sourceUnit: string;
  sourceInitialPaid: number;
  sourceRatePerSecond: number;
  targetDistributionLabel: string;
  targetChannelLabel: string;
  targetTotal: number;
  targetUnit: string;
  targetInitialPaid: number;
  targetRatePerSecond: number;
  caption: string;
};
type ActiveServicesState = {
  remaining: number;
  used: number;
  total: number;
  serviceSeconds: Record<MultiServiceKey, number>;
  onEndAllServices: () => void;
};
const serviceAccepts: Record<MultiServiceKey, string> = {
  luggage: "Accept: CKB",
  massage: "Accept: sats",
};
const fiberPassMeta = (
  <>
    Hub node
    <br />
    Supports CKB & sats
  </>
);
const luggageRouteDistribution: RouteDistributionConfig = {
  serviceName: "Luggage storage",
  serviceAvatar: "/chapter2/luggage-avatar.png",
  serviceAvatarAlt: "Luggage storage avatar",
  serviceAccepts: "Accept: CKB",
  sourceDistributionLabel: "Pico channel distribution",
  sourceChannelLabel: "Pico channel",
  sourceTotal: 1000,
  sourceUnit: "CKB",
  sourceInitialPaid: 0,
  sourceRatePerSecond: 0.1,
  targetDistributionLabel: "Luggage channel distribution",
  targetChannelLabel: "Luggage channel",
  targetTotal: 5000,
  targetUnit: "CKB",
  targetInitialPaid: 0,
  targetRatePerSecond: 0.1,
  caption: "Fiber Airport Pass now routes payment to the luggage storage service.",
};
const massageRouteDistribution: RouteDistributionConfig = {
  serviceName: "Massage chair",
  serviceAvatar: "/chapter2/massage-avatar.png",
  serviceAvatarAlt: "Massage chair avatar",
  serviceAccepts: "Accept: sats",
  sourceDistributionLabel: "Pico channel distribution",
  sourceChannelLabel: "Pico channel",
  sourceTotal: 1000,
  sourceUnit: "CKB",
  sourceInitialPaid: 200,
  sourceRatePerSecond: 1.1,
  targetDistributionLabel: "Sats route distribution",
  targetChannelLabel: "Massage (Lightning route)",
  targetTotal: 100000,
  targetUnit: "sats",
  targetInitialPaid: 0,
  targetRatePerSecond: 10,
  caption: "Fiber Pass bridges Pico’s CKB payment to a sats payment over Lightning",
};
const ACTIVE_USAGE_TOTALS = {
  pico: { total: 1000, unit: "CKB" },
  luggage: { total: 5000, unit: "CKB", ratePerSecond: 0.1 },
  massage: { total: 100000, unit: "sats", ratePerSecond: 10 },
} as const;

export function MultiServicePaymentRouteScene({
  scene,
  activeSceneId,
  onActiveChange,
  routeVariant = "luggage",
}: {
  scene: SceneConfig;
  activeSceneId: string;
  onActiveChange: (id: string) => void;
  routeVariant?: PaymentRouteVariant;
}) {
  return (
    <SceneShell
      scene={scene}
      activeSceneId={activeSceneId}
      onActiveChange={onActiveChange}
      stageStyle={() => ({ background: "var(--color-bg-yellow)" })}
    >
      {(progress) => (
        <div className={storyStyles.technicalTransitionStage}>
          <div className={storyStyles.technicalBaseLayer}>
            <MultiServiceRouteDistributionBoard
              routeVariant={routeVariant}
              progress={progress}
              isActive={activeSceneId === scene.id || (progress > 0.04 && progress < 0.98)}
            />
          </div>
        </div>
      )}
    </SceneShell>
  );
}

export function MultiServiceRouteDistributionBoard({
  routeVariant,
  progress,
  isActive,
}: {
  routeVariant: PaymentRouteVariant;
  progress: number;
  isActive: boolean;
}) {
  const config = routeVariant === "massage" ? massageRouteDistribution : luggageRouteDistribution;

  return (
    <RouteDistributionBoard
      config={config}
      progress={progress}
      isActive={isActive}
      isLightningRoute={routeVariant === "massage"}
    />
  );
}

function RouteDistributionBoard({
  config,
  progress,
  isActive,
  isLightningRoute,
}: {
  config: RouteDistributionConfig;
  progress: number;
  isActive: boolean;
  isLightningRoute: boolean;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const hasStartedRef = useRef(false);
  const shouldTick = (isActive || isVisible) && progress > 0.04;
  const sourcePaid = Math.min(
    config.sourceTotal,
    config.sourceInitialPaid + elapsedSeconds * config.sourceRatePerSecond,
  );
  const targetPaid = Math.min(
    config.targetTotal,
    config.targetInitialPaid + elapsedSeconds * config.targetRatePerSecond,
  );

  useEffect(() => {
    const board = boardRef.current;

    if (!board) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.45));
      },
      { threshold: [0, 0.45, 0.75] },
    );

    observer.observe(board);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (progress < 0.03) {
      hasStartedRef.current = false;
      setElapsedSeconds(0);
    }
  }, [progress]);

  useEffect(() => {
    if (!shouldTick) {
      return undefined;
    }

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      setElapsedSeconds(0);
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, ROUTE_DISTRIBUTION_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [shouldTick]);

  return (
    <div ref={boardRef} className={cx(channelStyles.surface, channelStyles.routeDistributionSurface)}>
      <h2 className={channelStyles.title}>Fiber Behind the Scenes</h2>

      <div className={channelStyles.routeDistributionGrid}>
        <RouteDistributionMeter
          label={config.sourceDistributionLabel}
          total={config.sourceTotal}
          paid={sourcePaid}
          unit={config.sourceUnit}
        />
        <RouteDistributionMeter
          label={config.targetDistributionLabel}
          total={config.targetTotal}
          paid={targetPaid}
          unit={config.targetUnit}
        />
      </div>

      <div className={channelStyles.routeDistributionRow}>
        <RouteDistributionNode
          imageSrc="/shared/pico-avatar.png"
          imageAlt="Pico avatar"
          name="Pico"
          meta="Asset: CKB"
        />
        <RouteDistributionConnector label={config.sourceChannelLabel} />
        <RouteDistributionNode
          imageSrc="/chapter2/fiber-pass-avatar.png"
          imageAlt="Fiber Airport Pass avatar"
          name="Fiber Airport Pass"
          meta={fiberPassMeta}
        />
        <RouteDistributionConnector
          label={config.targetChannelLabel}
          variant={isLightningRoute ? "lightning" : undefined}
        />
        <RouteDistributionNode
          imageSrc={config.serviceAvatar}
          imageAlt={config.serviceAvatarAlt}
          name={config.serviceName}
          meta={config.serviceAccepts}
        />
      </div>

      <p className={channelStyles.routeDistributionCaption}>{config.caption}</p>
    </div>
  );
}

function RouteDistributionMeter({
  label,
  total,
  paid,
  unit,
}: {
  label: string;
  total: number;
  paid: number;
  unit: string;
}) {
  const remaining = Math.max(0, total - paid);
  const paidPercent = Math.min(100, (paid / total) * 100);

  return (
    <div className={channelStyles.routeDistributionMeter}>
      <p className={channelStyles.routeDistributionMeterTitle}>{label}</p>
      <div
        className={channelStyles.routeDistributionBar}
        style={{ "--route-paid-percent": `${paidPercent}%` } as CSSProperties}
      >
        <span className={channelStyles.routeDistributionBarLabel}>
          Total: {formatCkb(total)} {unit}
        </span>
      </div>
      <div className={channelStyles.routeDistributionValues}>
        <span>
          {formatCkb(remaining)} {unit}
        </span>
        <span>
          {formatCkb(paid)} {unit}
        </span>
      </div>
    </div>
  );
}

function RouteDistributionNode({
  imageSrc,
  imageAlt,
  name,
  meta,
}: {
  imageSrc: string;
  imageAlt: string;
  name: string;
  meta: ReactNode;
}) {
  return (
    <div className={channelStyles.routeDistributionNode}>
      <NodeStatus />
      <BareAvatar imageSrc={imageSrc} imageAlt={imageAlt} />
      <p className={channelStyles.name}>{name}</p>
      <p className={cx(channelStyles.nodeMeta, channelStyles.nodeMetaMultiline)}>{meta}</p>
    </div>
  );
}

function RouteDistributionConnector({ label, variant }: { label: string; variant?: "lightning" }) {
  return (
    <div className={channelStyles.routeDistributionConnector}>
      <span className={channelStyles.routeDistributionLine} aria-hidden="true" />
      <span className={cx(channelStyles.routeDistributionPill, variant === "lightning" ? channelStyles.lightningRoutePill : undefined)}>
        {label}
      </span>
      <div className={channelStyles.channelStatus}>
        <span>Status:</span>
        <span className={channelStyles.statusDetail}>
          <span className={channelStyles.statusDot} style={{ background: "var(--color-status-active)" }} />
          Active
        </span>
      </div>
    </div>
  );
}

export function MultiServiceChannelScene({
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
      {(progress) => (
        <div className={channelStyles.scene}>
          <CueWatcher
            progress={progress}
            cue="system.channel-active"
            threshold={progressAtBeat(2, MULTI_SERVICE_CHANNEL_SCENE_BEATS)}
            resetThreshold={progressAtBeat(1.5, MULTI_SERVICE_CHANNEL_SCENE_BEATS)}
          />
          <MultiServiceChannelBoard progress={progress} />
        </div>
      )}
    </SceneShell>
  );
}

export function MultiServiceSettlementScene({
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
      stageStyle={() => ({ background: "var(--color-bg-yellow)" })}
    >
      {(progress) => (
        <div className={channelStyles.scene}>
          <CueWatcher
            progress={progress}
            cue="system.disconnect"
            threshold={progressAtBeat(0.8, MULTI_SERVICE_SETTLEMENT_SCENE_BEATS)}
            resetThreshold={progressAtBeat(0.3, MULTI_SERVICE_SETTLEMENT_SCENE_BEATS)}
          />
          <MultiServiceChannelBoard progress={progress} variant="settlement" settlement={settlement} />
        </div>
      )}
    </SceneShell>
  );
}

export function MultiServiceChannelBoard({
  progress,
  variant = "opening",
  caption,
  settlement,
  activeServices,
}: {
  progress: number;
  variant?: ChannelBoardVariant;
  caption?: string;
  settlement?: MultiServiceSettlementSnapshot;
  activeServices?: ActiveServicesState;
}) {
  const { playCue } = useSound();
  const isRouteScene = variant !== "opening";
  const isSettlementScene = variant === "settlement";
  const isActiveServicesScene = variant === "active-services";
  const isOpeningScene = variant === "opening";
  const usesSceneFiveLayout = isOpeningScene || isSettlementScene;
  const totalBeats = isSettlementScene ? MULTI_SERVICE_SETTLEMENT_SCENE_BEATS : MULTI_SERVICE_CHANNEL_SCENE_BEATS;
  const settlementCloseProgress = easeInOutSine(beatProgress(progress, 0, 1.2, MULTI_SERVICE_SETTLEMENT_SCENE_BEATS));
  const fillProgress = easeInOutSine(beatProgress(progress, 0, 1, totalBeats));
  const activeReveal = easeInOutSine(beatProgress(progress, 1, 1, totalBeats));
  const activeShown = isRouteScene || activeReveal > 0.5;
  const closedShown = isSettlementScene && settlementCloseProgress > 0.72;
  const channelFill = isSettlementScene ? 65 * (1 - settlementCloseProgress) : isRouteScene ? 100 : 65 + fillProgress * 35;
  const statusLabel = isSettlementScene ? (closedShown ? "Closed" : "Closing") : activeShown ? "Active" : "Opening";
  const statusColor = isSettlementScene
    ? closedShown
      ? "var(--color-bg-white)"
      : "var(--color-status-closing)"
    : activeShown
      ? "var(--color-status-active)"
      : "var(--color-status-opening)";

  if (isActiveServicesScene) {
    return activeServices ? (
      <ActiveUsageBoard
        activeServices={activeServices}
        onEndAllServices={() => {
          playCue("system.shutdown");
          activeServices.onEndAllServices();
        }}
        onEndHover={() => playCue("ui.pop")}
      />
    ) : null;
  }

  return (
    <div
      className={cx(
        channelStyles.surface,
        channelStyles.surfaceWithTitle,
        usesSceneFiveLayout ? channelStyles.openingSurface : undefined,
      )}
    >
      <h2 className={channelStyles.title}>Fiber Behind the Scenes</h2>

      <div className={channelStyles.paymentGroup}>
        <div className={channelStyles.paymentRow}>
          <div className={channelStyles.paymentNodeStack}>
            <NodeStatus />
            <BareAvatar imageSrc="/shared/pico-avatar.png" imageAlt="Pico avatar" />
            <p className={channelStyles.name}>Pico</p>
            {usesSceneFiveLayout ? <p className={channelStyles.nodeMeta}>Asset: CKB</p> : null}
          </div>

          <div className={channelStyles.channelStack}>
            <div className={channelStyles.channelWrap}>
              <div
                className={channelStyles.picoConnector}
                aria-hidden="true"
                style={{ opacity: isSettlementScene && closedShown ? 0 : 1 }}
              />
              <div className={channelStyles.channel}>
                <div
                  className={cx(channelStyles.channelFill, isSettlementScene ? channelStyles.channelFillClosing : undefined)}
                  style={{ width: `${channelFill}%` }}
                />
                <span className={channelStyles.channelLabel}>{usesSceneFiveLayout ? "Pico channel" : "Payment Channel (Layer 2)"}</span>
              </div>
            </div>

            <div className={channelStyles.channelStatus}>
              <span>Status:</span>
              <span className={channelStyles.statusDetail}>
                <span
                  className={channelStyles.statusDot}
                  style={{ background: statusColor }}
                />
                {statusLabel}
              </span>
            </div>
          </div>

          <div className={cx(channelStyles.paymentNodeStack, channelStyles.fiberPassStack)}>
            <NodeStatus />
            <BareAvatar imageSrc="/chapter2/fiber-pass-avatar.png" imageAlt="Fiber Airport Pass avatar" />
            <p className={channelStyles.passName}>Fiber Airport Pass</p>
            {usesSceneFiveLayout ? <p className={cx(channelStyles.nodeMeta, channelStyles.nodeMetaMultiline)}>{fiberPassMeta}</p> : null}
          </div>
        </div>
      </div>

      <div className={cx(channelStyles.services, isSettlementScene ? channelStyles.servicesSettled : undefined)}>
        <div
          className={cx(channelStyles.serviceConnector, channelStyles.connectorTop, channelStyles.staticConnector)}
          aria-hidden="true"
        >
          {usesSceneFiveLayout ? <span className={channelStyles.paymentPill}>Luggage channel</span> : null}
        </div>

        <div
          className={cx(channelStyles.serviceConnector, channelStyles.connectorBottom, channelStyles.staticConnector)}
          aria-hidden="true"
        >
          {usesSceneFiveLayout ? (
            <span className={cx(channelStyles.paymentPill, channelStyles.paymentPillBottom, channelStyles.lightningRoutePill)}>
              Massage (Lightning route)
            </span>
          ) : null}
        </div>

        {multiServiceServices.map((service) => (
          <ServiceNode
            key={service.key}
            className={service.key === "luggage" ? channelStyles.serviceLuggage : channelStyles.serviceMassage}
            imageSrc={service.imageSrc}
            imageAlt={service.imageAlt}
            name={service.name}
            accepts={serviceAccepts[service.key]}
          />
        ))}
      </div>
      {isSettlementScene ? (
        <p className={channelStyles.sceneCaption}>Pico channel closes when the session ends. Service routes remain available.</p>
      ) : isOpeningScene ? (
        <p className={channelStyles.sceneCaption}>Fiber Airport Pass has routes and liquidity ready.</p>
      ) : caption ? (
        <p className={channelStyles.sceneCaption}>{caption}</p>
      ) : null}
    </div>
  );
}

function ActiveUsageBoard({
  activeServices,
  onEndAllServices,
  onEndHover,
}: {
  activeServices: ActiveServicesState;
  onEndAllServices: () => void;
  onEndHover: () => void;
}) {
  const luggageSeconds = activeServices.serviceSeconds.luggage;
  const massageSeconds = activeServices.serviceSeconds.massage;
  const luggagePaid = luggageSeconds * ACTIVE_USAGE_TOTALS.luggage.ratePerSecond;
  const massagePaid = massageSeconds * ACTIVE_USAGE_TOTALS.massage.ratePerSecond;

  return (
    <div className={cx(channelStyles.surface, channelStyles.activeUsageSurface)}>
      <div className={channelStyles.activeUsageMain}>
        <div className={channelStyles.activeUsagePicoFiber}>
          <div className={channelStyles.activeUsageStatusRow}>
            <NodeStatus />
            <NodeStatus />
          </div>
          <div className={channelStyles.activeUsageChannelRow}>
            <div className={channelStyles.activeUsageNode}>
              <BareAvatar imageSrc="/shared/pico-avatar.png" imageAlt="Pico avatar" />
            </div>
            <ActiveUsagePicoConnector />
            <div className={channelStyles.activeUsageNode}>
              <BareAvatar imageSrc="/chapter2/fiber-pass-avatar.png" imageAlt="Fiber Airport Pass avatar" />
            </div>
          </div>
          <div className={channelStyles.activeUsageNameRow}>
            <div className={channelStyles.activeUsageNodeMeta}>
              <p className={channelStyles.name}>Pico</p>
              <p className={channelStyles.nodeMeta}>Asset: CKB</p>
            </div>
            <div className={channelStyles.activeUsageNodeMeta}>
              <p className={channelStyles.passName}>Fiber Airport Pass</p>
              <p className={cx(channelStyles.nodeMeta, channelStyles.nodeMetaMultiline)}>{fiberPassMeta}</p>
            </div>
          </div>
        </div>

        <ActiveUsageService
          className={channelStyles.activeUsageLuggage}
          imageSrc="/chapter2/luggage-avatar.png"
          imageAlt="Luggage storage avatar"
          name="Luggage storage"
          accepts="Accept: CKB"
          elapsedSeconds={luggageSeconds}
        />
        <ActiveUsageService
          className={channelStyles.activeUsageMassage}
          imageSrc="/chapter2/massage-avatar.png"
          imageAlt="Massage chair avatar"
          name="Massage chair"
          accepts="Accept: sats"
          elapsedSeconds={massageSeconds}
        />

        <ActiveUsageServiceConnector
          className={channelStyles.activeUsageConnectorTop}
          label="Luggage channel"
        />
        <ActiveUsageServiceConnector
          className={channelStyles.activeUsageConnectorBottom}
          label="Massage (Lightning route)"
          inverted
        />
      </div>

      <div className={channelStyles.activeUsageMeters}>
        <ActiveUsageMeter
          label="Pico channel distribution"
          total={ACTIVE_USAGE_TOTALS.pico.total}
          remaining={activeServices.remaining}
          paid={activeServices.used}
          unit={ACTIVE_USAGE_TOTALS.pico.unit}
        />
        <ActiveUsageMeter
          label="Luggage channel distribution"
          total={ACTIVE_USAGE_TOTALS.luggage.total}
          remaining={ACTIVE_USAGE_TOTALS.luggage.total - luggagePaid}
          paid={luggagePaid}
          unit={ACTIVE_USAGE_TOTALS.luggage.unit}
        />
        <ActiveUsageMeter
          label="Sats route distribution"
          total={ACTIVE_USAGE_TOTALS.massage.total}
          remaining={ACTIVE_USAGE_TOTALS.massage.total - massagePaid}
          paid={massagePaid}
          unit={ACTIVE_USAGE_TOTALS.massage.unit}
        />
      </div>

      <button
        type="button"
        className={channelStyles.endServicesButton}
        onMouseEnter={onEndHover}
        onClick={onEndAllServices}
      >
        End all services
      </button>
    </div>
  );
}

function ActiveUsagePicoConnector() {
  return (
    <div className={channelStyles.activeUsagePicoConnector} aria-hidden="true">
      <span className={channelStyles.activeUsageLine} />
      <span className={channelStyles.activeUsagePill}>Pico channel</span>
      <div className={channelStyles.activeUsageStatus}>
        <span>Status:</span>
        <span className={channelStyles.statusDetail}>
          <span className={channelStyles.statusDot} style={{ background: "var(--color-status-active)" }} />
          Active
        </span>
      </div>
    </div>
  );
}

function ActiveUsageServiceConnector({
  className,
  label,
  inverted,
}: {
  className: string;
  label: string;
  inverted?: boolean;
}) {
  return (
    <div className={cx(channelStyles.activeUsageServiceConnector, className)} aria-hidden="true">
      <span className={cx(channelStyles.activeUsageServiceCorner, inverted ? channelStyles.activeUsageServiceCornerInverted : undefined)} />
      <span className={channelStyles.activeUsagePill}>{label}</span>
    </div>
  );
}

function ActiveUsageService({
  className,
  imageSrc,
  imageAlt,
  name,
  accepts,
  elapsedSeconds,
}: {
  className: string;
  imageSrc: string;
  imageAlt: string;
  name: string;
  accepts: string;
  elapsedSeconds: number;
}) {
  return (
    <div className={cx(channelStyles.activeUsageService, className)}>
      <BareAvatar imageSrc={imageSrc} imageAlt={imageAlt} />
      <div className={channelStyles.activeUsageServiceMeta}>
        <NodeStatus />
        <p className={channelStyles.serviceName}>{name}</p>
        <p className={channelStyles.accepts}>{accepts}</p>
        <p className={channelStyles.accepts}>Elapsed time: {elapsedSeconds.toLocaleString("en-US")} s</p>
      </div>
    </div>
  );
}

function ActiveUsageMeter({
  label,
  total,
  remaining,
  paid,
  unit,
}: {
  label: string;
  total: number;
  remaining: number;
  paid: number;
  unit: string;
}) {
  const paidPercent = Math.min(100, Math.max(0, (paid / total) * 100));

  return (
    <div className={channelStyles.activeUsageMeter}>
      <p className={channelStyles.activeUsageMeterTitle}>{label}</p>
      <div
        className={channelStyles.activeUsageBar}
        style={{ "--route-paid-percent": `${paidPercent}%` } as CSSProperties}
      >
        <span className={channelStyles.activeUsageBarLabel}>
          Total: {formatCkb(total)} {unit}
        </span>
      </div>
      <div className={channelStyles.activeUsageValues}>
        <span>
          {formatCkb(Math.max(0, remaining))} {unit}
        </span>
        <span>
          {formatCkb(Math.min(total, paid))} {unit}
        </span>
      </div>
    </div>
  );
}
