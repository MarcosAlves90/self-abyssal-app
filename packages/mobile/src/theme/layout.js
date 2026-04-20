export function getResponsiveLayout(width) {
  return {
    isCompact: width < 480,
    isTablet: width >= 760,
    isWide: width >= 1040,
    contentMaxWidth: width >= 1360 ? 1180 : width >= 1040 ? 1040 : 760
  };
}
