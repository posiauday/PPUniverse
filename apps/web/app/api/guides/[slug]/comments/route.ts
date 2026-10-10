import { postComment } from "../../../../../lib/comment-post";
import { contentRepository } from "../../../../../lib/content";
import { withObservability } from "../../../../../lib/observability";

/** Posts a comment on a published guide (MVP-040); the rules are in postComment. */
export const POST = withObservability(
  "POST /api/guides/[slug]/comments",
  async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    const { slug } = await context.params;
    return postComment(request, slug, async () => {
      const article = await contentRepository.findPublishedArticleBySlug(slug);
      return article ? { kind: "guide", articleId: article.id } : null;
    });
  },
);
