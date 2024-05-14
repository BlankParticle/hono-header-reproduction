import { serve } from "@hono/node-server";
import { Context, Hono } from "hono";
import { setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const app = new Hono();

const route1 = (c: Context) => {
  setCookie(c, "test-cookie", "route-1");
  return { route: "route-1" };
};

const route2 = (c: Context) => {
  setCookie(c, "test-cookie", "route-2");
  return { route: "route-2" };
};

const route3 = (c: Context) => {
  c.res.headers.set("x-custom", "custom-header");
  return { route: "route-3" };
};

const routeHandler = (c: Context) => {
  switch (c.req.path) {
    case "/test/route-1":
      return route1(c);
    case "/test/route-2":
      return route2(c);
    case "/test/route-3":
      return route3(c);
    default:
      return { route: "not-found" };
  }
};

const craftResponse = async (c: Context) => {
  const res = routeHandler(c);
  const headers = {
    "x-powered-by": "maybe-trpc",
    "content-type": "application/json",
  };

  type TRPCFetchHandlerReturn = ReturnType<typeof fetchRequestHandler>; // fetchRequestHandler returns a Promise<Response>

  // This is a simplified version of what trpc does
  const trpcResponse = new Response(JSON.stringify(res), { headers });
  return trpcResponse;
};

const highLevelTRPClikeMiddleware = createMiddleware((c) => {
  return craftResponse(c);
});

app.use("/test/*", highLevelTRPClikeMiddleware);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
