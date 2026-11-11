// Keep the original assignment as the primary product type. Extra placements
// reference the same product, inventory and media rather than copying records.
export const referenceId = (value) => String(value?._id || value || '');

export const productMemberships = (product) => {
  const assignments = [
    { collectionId: product.collectionId, subCollectionId: product.subCollectionId },
    ...(product.additionalCollections || []),
  ];
  const seen = new Set();
  return assignments.filter((assignment) => {
    const key = `${referenceId(assignment.collectionId)}:${referenceId(assignment.subCollectionId)}`;
    if (!referenceId(assignment.collectionId) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const membershipQuery = (collectionId, subCollectionIds = null) => {
  const subQuery = subCollectionIds ? { $in: subCollectionIds } : undefined;
  return { $or: [
    { collectionId, ...(subQuery ? { subCollectionId: subQuery } : {}) },
    { additionalCollections: { $elemMatch: {
      collectionId, ...(subQuery ? { subCollectionId: subQuery } : {}),
    } } },
  ] };
};

// Visibility is per placement: a hidden sub-collection does not hide the same
// product's assignment to another visible sub-collection or collection.
export const visibleProductMemberships = (product, subcollections) => productMemberships(product)
  .filter((entry) => !subcollections.some((sub) => sub.hidden === true
    && referenceId(sub.collectionId) === referenceId(entry.collectionId)
    && referenceId(sub._id) === referenceId(entry.subCollectionId)));
