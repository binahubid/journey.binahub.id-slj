import tokens from "../../design-tokens.json";

export const DESIGN_TOKENS = {
  colors: {
    primary: tokens.color.primary.value, // #0F1E3D
    secondary: tokens.color.secondary.value,
    accent: tokens.color.accent.value, // #C79A3C
    background: tokens.color.background.value, // #FAF8F4
    surface: tokens.color.surface.value,
    textPrimary: tokens.color["text-primary"].value,
    textSecondary: tokens.color["text-secondary"].value,
    success: tokens.color.success.value, // #2F855A
    warning: tokens.color.warning.value, // #C05621
    danger: tokens.color.danger.value,
    info: tokens.color.info.value,
    border: tokens.color.border.value,
  },
  containerWidth: {
    landingPage: tokens["container-width"]["landing-page"].value,
    dashboard: tokens["container-width"].dashboard.value,
    wizard: tokens["container-width"].wizard.value,
  },
  animation: {
    spring: tokens.animation["easing-spring"].value,
    durationBase: tokens.animation["duration-base"].value,
  },
} as const;
