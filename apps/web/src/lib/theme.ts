export const themeColors = {
  light: {
    primary: "#151C24",      // Cinza escuro principal
    secondary: "#58DDAA",    // Verde claro para botões e elementos interativos
    accent: "#3b82f6",
    background: "#ffffff",
    foreground: "#151C24",
    muted: "#f7fafc",
    border: "#e2e8f0",
    success: "#58DDAA",
    warning: "#d69e2e",
    error: "#e53e3e",
    info: "#3182ce",
    // Texto sobre secondary (botões verdes)
    "secondary-foreground": "#151C24"  // Texto escuro sobre fundo verde
  },
  dark: {
    primary: "#ffffff",
    secondary: "#58DDAA",    // Verde claro mantido no dark mode
    accent: "#63b3ed",
    background: "#151C24",   // Fundo escuro principal
    foreground: "#ffffff",
    muted: "#2d3748",
    border: "#4a5568",
    success: "#58DDAA",
    warning: "#d69e2e",
    error: "#e53e3e",
    info: "#63b3ed",
    // Texto sobre secondary (botões verdes)
    "secondary-foreground": "#151C24"  // Texto escuro sobre fundo verde
  }
}

// Regras de Contraste para Secondary
export const contrastRules = {
  secondary: {
    background: "#58DDAA",     // Verde claro para botões
    foreground: "#151C24",     // Texto escuro (primary) para contraste
    description: "Todos os textos sobre backgrounds #58DDAA devem usar cor escura (#151C24) para garantir legibilidade"
  }
}

export const animations = {
  fast: "150ms ease",
  normal: "300ms ease",
  slow: "500ms ease",
  bounce: "600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)"
}

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem"
}

export const borderRadius = {
  none: "0",
  sm: "0.125rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px"
}