export function getResponsiveLayout(width) {
  const isTiny = width < 360;
  const isCompact = width < 480;
  const isTablet = width >= 760;
  const isWide = width >= 1040;

  return {
    isTiny,
    isCompact,
    isTablet,
    isWide,
    contentMaxWidth: width >= 1360 ? 1180 : width >= 1040 ? 1040 : 760,
    contentPadding: isCompact ? 16 : 24,
    heroTitleSize: isTiny ? 32 : isCompact ? 38 : width < 760 ? 44 : width < 1040 ? 48 : 52,
    heroTitleLineHeight:
      isTiny ? 38 : isCompact ? 42 : width < 760 ? 48 : width < 1040 ? 52 : 56,
    sectionTitleSize: isTiny ? 22 : isCompact ? 24 : 30,
    sectionTitleLineHeight: isTiny ? 28 : isCompact ? 30 : 34,
    featureTitleSize: isTiny ? 24 : isCompact ? 28 : 34,
    featureTitleLineHeight: isTiny ? 30 : isCompact ? 32 : 38,
    statCardMinWidth: isTiny ? 104 : isCompact ? 118 : 136
  };
}
