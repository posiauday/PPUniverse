import { postComment } from "../../../../../lib/comment-post";
import { componentRepository } from "../../../../../lib/components";
import { withObservability } from "../../../../../lib/observability";
import { componentsLibraryOn } from "../../../../../lib/site-switches";

/**
 * Posts a question or answer on a published component's page (MVP-051;
 * docs/final-decisions.md, 2026-10-10, "Comments on component pages"), with
 * the same rules as guide comments. Not on a Coming soon or hidden component,
 * nor while the library is switched off: those are a 404, like the page.
 */
export const POST = withObservability(
  "POST /api/components/[slug]/comments",
  async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    const { slug } = await context.params;
    return postComment(request, slug, async () => {
      if (!(await componentsLibraryOn())) return null;
      const component = await componentRepository.findPublicBySlug(slug);
      return component ? { kind: "component", componentId: component.id } : null;
    });
  },
);
