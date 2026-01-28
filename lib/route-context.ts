export type RouteContext = {
  params?: Promise<Record<string, string | string[] | undefined>>;
};

export const getRouteParam = async (context: RouteContext, key: string) => {
  const params = await context.params;
  const value = params?.[key];
  return typeof value === "string" ? value : null;
};
