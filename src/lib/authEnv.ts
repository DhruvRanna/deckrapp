export const isPreviewAuthEnvironment = () => {
  if (typeof window === "undefined") return false;

  const host = window.location.hostname;
  return host.includes("lovableproject.com") || host.includes("id-preview--");
};

export const getAuthEnvironmentLabel = () =>
  isPreviewAuthEnvironment() ? "Preview relay mode" : "Direct auth mode";
