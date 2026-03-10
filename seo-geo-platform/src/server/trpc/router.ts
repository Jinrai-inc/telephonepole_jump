import { initTRPC } from "@trpc/server";
import { Context } from "./context";
import { keywordsRouter } from "./routers/keywords";
import { rankingsRouter } from "./routers/rankings";
import { geoRouter } from "./routers/geo";
import { articlesRouter } from "./routers/articles";
import { auditRouter } from "./routers/audit";
import { regulationsRouter } from "./routers/regulations";
import { reportsRouter } from "./routers/reports";
import { notificationsRouter } from "./routers/notifications";
import { dashboardRouter } from "./routers/dashboard";
import { projectsRouter } from "./routers/projects";

const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  dashboard: dashboardRouter,
  projects: projectsRouter,
  keywords: keywordsRouter,
  rankings: rankingsRouter,
  geo: geoRouter,
  articles: articlesRouter,
  audit: auditRouter,
  regulations: regulationsRouter,
  reports: reportsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
