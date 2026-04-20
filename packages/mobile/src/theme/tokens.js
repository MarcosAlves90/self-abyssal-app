export const theme = {
  colors: {
    background: "#040b17",
    backgroundAlt: "#071226",
    surface: "#0d1a2f",
    surfaceRaised: "#112340",
    border: "rgba(122, 225, 255, 0.16)",
    accent: "#31e7ff",
    accentSoft: "#8df9ff",
    accentWarm: "#1ad1c9",
    text: "#f5fbff",
    textMuted: "#96b7c9",
    success: "#72f0b8",
    warning: "#ffd98a",
    danger: "#ff8b9c"
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    pill: 999
  },
  fonts: {
    body: "SpaceGrotesk_500Medium",
    bodyBold: "SpaceGrotesk_700Bold",
    display: "CormorantGaramond_600SemiBold"
  }
};

export function formatCurrency(priceCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(priceCents / 100);
}

export function getCategoryLabel(category) {
  return (
    {
      entradas: "Entradas",
      principais: "Principais",
      sobremesas: "Sobremesas",
      bebidas: "Bebidas"
    }[category] || category
  );
}
