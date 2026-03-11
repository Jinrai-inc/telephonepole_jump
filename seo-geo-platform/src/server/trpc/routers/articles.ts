import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";
import {
  generateArticleStructure,
  generateArticleContent,
  proofreadArticle,
  factCheckArticle,
  checkAiDetection,
} from "@/server/services/anthropicAi";

const t = initTRPC.context<Context>().create();

export const articlesRouter = t.router({
  getAll: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return prisma.article.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
        include: { assignee: true, regulation: true },
      });
    }),

  getById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.article.findUnique({
        where: { id: input.id },
        include: { checks: true, regulation: { include: { rules: true } } },
      });
    }),

  create: t.procedure
    .input(z.object({
      projectId: z.string(),
      title: z.string().min(1),
      targetKeyword: z.string().optional(),
      regulationId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.article.create({ data: input });
    }),

  update: t.procedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      contentHtml: z.string().optional(),
      contentText: z.string().optional(),
      structureJson: z.any().optional(),
      status: z.enum(["DRAFT", "WRITING", "PROOFREADING", "REVIEWING", "PUBLISHED"]).optional(),
      wordCount: z.number().optional(),
      seoScore: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.article.update({ where: { id }, data });
    }),

  delete: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.article.delete({ where: { id: input.id } });
    }),

  addCheck: t.procedure
    .input(z.object({
      articleId: z.string(),
      checkType: z.enum(["PROOFREAD", "FACTCHECK", "COPYCHECK", "AI_DETECT"]),
      resultJson: z.any(),
      issuesCount: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      return prisma.articleCheck.create({ data: input });
    }),

  // --- AI機能: 構成案生成 ---
  generateStructure: t.procedure
    .input(z.object({ articleId: z.string(), keyword: z.string() }))
    .mutation(async ({ input }) => {
      const resultText = await generateArticleStructure(input.keyword);
      let structureJson;
      try {
        const jsonMatch = resultText.match(/\[[\s\S]*\]/);
        structureJson = jsonMatch ? JSON.parse(jsonMatch[0]) : resultText;
      } catch {
        structureJson = resultText;
      }
      return prisma.article.update({
        where: { id: input.articleId },
        data: { structureJson },
      });
    }),

  // --- AI機能: 記事本文生成 ---
  generateContent: t.procedure
    .input(z.object({ articleId: z.string(), keyword: z.string() }))
    .mutation(async ({ input }) => {
      const article = await prisma.article.findUnique({ where: { id: input.articleId } });
      const structure = article?.structureJson ? JSON.stringify(article.structureJson) : "";
      const contentText = await generateArticleContent(input.keyword, structure);
      return prisma.article.update({
        where: { id: input.articleId },
        data: {
          contentText,
          wordCount: contentText.length,
          status: "WRITING",
        },
      });
    }),

  // --- AI機能: 自動チェック実行 ---
  runCheck: t.procedure
    .input(z.object({
      articleId: z.string(),
      checkType: z.enum(["PROOFREAD", "FACTCHECK", "AI_DETECT"]),
    }))
    .mutation(async ({ input }) => {
      const article = await prisma.article.findUnique({ where: { id: input.articleId } });
      if (!article?.contentText) throw new Error("記事本文がありません");

      let resultText: string;
      switch (input.checkType) {
        case "PROOFREAD":
          resultText = await proofreadArticle(article.contentText);
          break;
        case "FACTCHECK":
          resultText = await factCheckArticle(article.contentText);
          break;
        case "AI_DETECT":
          resultText = await checkAiDetection(article.contentText);
          break;
      }

      let resultJson;
      let issuesCount = 0;
      try {
        const jsonMatch = resultText.match(/[\[{][\s\S]*[\]}]/);
        resultJson = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: resultText };
        if (Array.isArray(resultJson)) {
          issuesCount = resultJson.length;
        } else if (resultJson.issues) {
          issuesCount = resultJson.issues.length;
        }
      } catch {
        resultJson = { raw: resultText };
      }

      return prisma.articleCheck.create({
        data: {
          articleId: input.articleId,
          checkType: input.checkType,
          resultJson,
          issuesCount,
        },
      });
    }),
});
