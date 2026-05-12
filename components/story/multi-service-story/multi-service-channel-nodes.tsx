"use client";

import { AvatarNode, cx } from "../shared";
import channelStyles from "./multi-service-channel.module.css";

export function BareAvatar({ imageSrc, imageAlt }: { imageSrc: string; imageAlt: string }) {
  return (
    <AvatarNode
      className={channelStyles.avatarNode}
      statusClassName={channelStyles.hiddenNodePart}
      dotClassName={channelStyles.hiddenNodePart}
      avatarClassName={channelStyles.avatarBox}
      imageClassName={channelStyles.avatarImage}
      nameClassName={channelStyles.hiddenNodePart}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      name=""
    />
  );
}

export function NodeStatus({ channelCountLabel }: { channelCountLabel?: string }) {
  return (
    <div className={channelStyles.nodeStatusStack}>
      <div className={channelStyles.nodeStatus}>
        <span className={channelStyles.nodeDot} />
        <span>Online</span>
      </div>
      {channelCountLabel ? <p className={channelStyles.channelCount}>{channelCountLabel}</p> : null}
    </div>
  );
}

export function ServiceNode({
  className,
  imageSrc,
  imageAlt,
  name,
  accepts,
  detail,
}: {
  className: string;
  imageSrc: string;
  imageAlt: string;
  name: string;
  accepts: string;
  detail?: string;
}) {
  return (
    <div className={cx(channelStyles.service, className)}>
      <AvatarNode
        className={channelStyles.avatarNode}
        statusClassName={channelStyles.hiddenNodePart}
        dotClassName={channelStyles.hiddenNodePart}
        avatarClassName={channelStyles.avatarBox}
        imageClassName={channelStyles.avatarImage}
        nameClassName={channelStyles.hiddenNodePart}
        imageSrc={imageSrc}
        imageAlt={imageAlt}
        name=""
      />
      <div className={channelStyles.serviceMeta}>
        <NodeStatus />
        <p className={channelStyles.serviceName}>{name}</p>
        <p className={channelStyles.accepts}>{accepts}</p>
        {detail ? <p className={channelStyles.accepts}>{detail}</p> : null}
      </div>
    </div>
  );
}
