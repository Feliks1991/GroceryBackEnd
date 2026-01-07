import {
  readProductsComments,
  readProductsCategoryRating,
} from "../utils/productsFilesService.mjs";
import { writeJSON } from "../utils/RWservice.mjs";

//Вспомогательные функции

const checkRatingObject = (ratingObject, commentsArray) => {
  const ratingObjectKeys = new Map(Object.entries(ratingObject));

  const referenceRatingKeys = {
    average: 0,
    ratingLength: 0,
    rating5Length: 0,
    rating4Length: 0,
    rating3Length: 0,
    rating2Length: 0,
    rating1Length: 0,
  };

  if (ratingObjectKeys.size !== Object.keys(referenceRatingKeys).length) {
    return regeneratedObjectRating(referenceRatingKeys, commentsArray);
  }

  for (const key of Object.keys(referenceRatingKeys)) {
    if (!ratingObjectKeys.has(key)) {
      return regeneratedObjectRating(referenceRatingKeys, commentsArray);
    }
  }

  return ratingObject;
};

const regeneratedObjectRating = (ratingObject, commentsArray) => {
  let ratingSum = 0;

  const regeneratedObject = { ...ratingObject };

  commentsArray.forEach((comment) => {
    ratingSum += comment.rating;
    ++regeneratedObject[`rating${comment.rating}Length`];
    ++regeneratedObject.ratingLength;
  });

  regeneratedObject.average = ratingSum / regeneratedObject.ratingLength || 0;

  return regeneratedObject;
};

// КОНТРОЛЛЕРЫ

// Поллучение комментариев продукта

export const getComments = async (req, res, next) => {
  const { category, sku } = req.params;
  const { productsCommentsData } = await readProductsComments(category);
  const { productsRatingsData } = await readProductsCategoryRating(category);

  const returnedObj = {
    comments: productsCommentsData[sku],
    rating: productsRatingsData[sku],
  };
  res.status(200).json(returnedObj);
};

// Добавление комментария
export const addComment = async (req, res, next) => {
  const { category, sku } = req.params;
  const { comment, rating } = req.body;
  const { user } = req.auth;

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    res.status(422).json({ message: "Data is not valid" });
    return;
  }

  const { productsCommentsPath, productsCommentsData } = await readProductsComments(category);
  const { productsRatingsPath, productsRatingsData } = await readProductsCategoryRating(category);

  if (!productsCommentsData[sku]) {
    productsCommentsData[sku] = [];
  }
  if (!productsRatingsData[sku]) {
    productsRatingsData[sku] = {};
  }

  const indexes = productsCommentsData[sku].map((comment) => +comment.id.split("-").at(-1));
  const maxIndex = indexes.length ? Math.max(...indexes) : 0;

  const newComment = {
    id: `${sku}-${maxIndex + 1}`,
    user: { name: user.name, id: user.id },
    date: new Date(),
    comment: comment,
    rating: rating,
  };

  const addedRating = checkRatingObject(productsRatingsData[sku], productsCommentsData[sku]);

  addedRating.average =
    (addedRating.average * addedRating.ratingLength + rating) / (addedRating.ratingLength + 1);
  ++addedRating[`rating${rating}Length`];
  ++addedRating.ratingLength;

  productsRatingsData[sku] = addedRating;
  productsCommentsData[sku].push(newComment);

  await Promise.all([
    writeJSON(productsCommentsPath, productsCommentsData),
    writeJSON(productsRatingsPath, productsRatingsData),
  ]);

  res.json(newComment);
};

// Удаление комментария
export const deleteComment = async (req, res, next) => {
  const { category, id } = req.params;
  const { productsCommentsPath, productsCommentsData } = await readProductsComments(category);
  const { productsRatingsPath, productsRatingsData } = await readProductsCategoryRating(category);

  const sku = id.split("-").at(0);
  const updatedRating = checkRatingObject(productsRatingsData[sku], productsCommentsData[sku]);

  const deletedCommentIndex = productsCommentsData[sku].findIndex((comment) => comment.id === id);

  if (deletedCommentIndex === -1) {
    return res.status(404).json({ message: "Comment not found" });
  }

  const [deletedComment] = productsCommentsData[sku].splice(deletedCommentIndex, 1);

  updatedRating.average =
    (updatedRating.average * updatedRating.ratingLength - deletedComment.rating) /
      (updatedRating.ratingLength - 1) || 0;

  --updatedRating[`rating${deletedComment.rating}Length`];
  --updatedRating.ratingLength;

  productsRatingsData[sku] = updatedRating;

  await Promise.all([
    writeJSON(productsCommentsPath, productsCommentsData),
    writeJSON(productsRatingsPath, productsRatingsData),
  ]);

  res.json(productsCommentsData[sku]);
};

// Обновление комментария
export const updateComment = async (req, res, next) => {
  const { category, id } = req.params;
  const { rating, comment } = req.body;

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    res.status(422).json({ message: "Data is not valid" });
    return;
  }

  const { productsCommentsPath, productsCommentsData } = await readProductsComments(category);
  const { productsRatingsPath, productsRatingsData } = await readProductsCategoryRating(category);

  const sku = id.split("-").at(0);

  const updatedCommentIndex = productsCommentsData[sku].findIndex((comment) => comment.id === id);
  if (updatedCommentIndex === -1) {
    res.status(404).json({message: "Comment not found"});
    return;
  }

  const updatedComment = productsCommentsData[sku][updatedCommentIndex];

  if (updatedComment.rating === rating && updatedComment.comment === comment) {
    res.status(200).json({message: "Comment updated"});
    return;
  }

  const updatedRating = checkRatingObject(productsRatingsData[sku], productsCommentsData[sku]);

  let newComment;

  if (updatedComment.rating !== rating) {
    const ratingDelta = rating - updatedComment.rating;

    updatedRating.average =
      (updatedRating.average * updatedRating.ratingLength + ratingDelta) /
      updatedRating.ratingLength;

    updatedRating[`rating${updatedComment.rating}Length`] = Math.max(
      0,
      updatedRating[`rating${updatedComment.rating}Length`] - 1
    );
    ++updatedRating[`rating${rating}Length`];

    newComment = {
      ...updatedComment,
      date: new Date(),
      comment: comment,
      rating: rating,
    };
    productsRatingsData[sku] = updatedRating;

    await writeJSON(productsRatingsPath, productsRatingsData);
  } else {
    newComment = {
      ...updatedComment,
      date: new Date(),
      comment: comment,
    };
  }

  productsCommentsData[sku].splice(updatedCommentIndex, 1, newComment);

  await writeJSON(productsCommentsPath, productsCommentsData);

  res.json(updatedRating);
};
