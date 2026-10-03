import * as service from "./comments.service.js";
import { HttpError } from "../../common/utils/httpError.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Comments error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const createCommentController = handle(async (req, res) => {
  const reportId = req.params.id || req.params.problemId;
  const { body, visibility } = req.body;

  const comment = await service.addComment({
    reportId,
    actor: req.user,
    body,
    visibility,
  });

  res.status(201).json({
    message: "Comentariul a fost adăugat cu succes.",
    comment,
  });
});

export const listCommentsController = handle(async (req, res) => {
  const reportId = req.params.id || req.params.problemId;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const result = await service.listComments({
    reportId,
    actor: req.user,
    page,
    limit,
  });

  res.json(result);
});

export const deleteCommentController = handle(async (req, res) => {
  const reportId = req.params.id || req.params.problemId;
  const commentId = req.params.commentId || req.params.id;

  await service.deleteComment({
    reportId,
    commentId,
    actor: req.user,
  });

  res.status(200).json({ message: "Comentariul a fost șters." });
});
