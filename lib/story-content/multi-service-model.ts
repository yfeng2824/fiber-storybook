export const MULTI_SERVICE_TOTAL_CKB = 1000;
export const MULTI_SERVICE_START_REMAINING_CKB = 137;
export const MULTI_SERVICE_END_REMAINING_CKB = 104;
export const MULTI_SERVICE_ACTIVE_WINDOW_SECONDS = 30;
export const MULTI_SERVICE_CKB_RATE_PER_SECOND = 1.1;

export const multiServiceDefaultSettlement = {
  remaining: 104,
  used: 896,
  total: 1000,
  serviceSeconds: {
    luggage: 2630,
    massage: 633,
  },
};

export const multiServiceServices = [
  {
    key: "luggage",
    name: "Luggage storage",
    rate: "Rate: 0.1 CKB / sec",
    pill: "Paying 0.1 CKB / sec",
    ckbEquivalentPerSecond: 0.1,
    endSeconds: 2630,
    startSeconds: 2600,
    imageSrc: "/chapter2/luggage-avatar.png",
    imageAlt: "Luggage storage avatar",
  },
  {
    key: "massage",
    name: "Massage chair",
    rate: "Rate: 10 sats / sec",
    pill: "Paying 10 sats / sec",
    ckbEquivalentPerSecond: 1,
    endSeconds: 633,
    startSeconds: 603,
    imageSrc: "/chapter2/massage-avatar.png",
    imageAlt: "Massage chair avatar",
  },
] as const;

export type MultiServiceKey = (typeof multiServiceServices)[number]["key"];
