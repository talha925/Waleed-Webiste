"use client";

import dynamic from "next/dynamic";

const RealTimeUpdates = dynamic(
  () =>
    import("@/components/common/RealTimeUpdates").then((mod) => ({
      default: mod.RealTimeUpdates,
    })),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function RealTimeUpdatesWrapper() {
  return <RealTimeUpdates />;
}
