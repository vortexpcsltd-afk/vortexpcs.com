// Editor-only module declaration to satisfy TS when cache is stale.
declare module "./components/ActivePromotionalBanner" {
  import type { ComponentProps } from "react";
  export function ActivePromotionalBanner(
    props: ComponentProps<"div"> & {
      onBannerVisibilityChange?: (visible: boolean) => void;
    }
  ): JSX.Element;
  export default ActivePromotionalBanner;
}
