export const slugify = (value) => {
  let result = '';
  let separatorPending = false;

  for (const character of String(value).toLowerCase().trim()) {
    const code = character.charCodeAt(0);
    const isLetter = code >= 97 && code <= 122;
    const isNumber = code >= 48 && code <= 57;
    if (isLetter || isNumber) {
      if (separatorPending && result) result += '-';
      result += character;
      separatorPending = false;
    } else if (result) {
      separatorPending = true;
    }
  }

  return result;
};

export const createUniqueSlug = async (Model, name, excludeId = null) => {
  const base = slugify(name) || 'collection';
  let slug = base;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Model.findOne(query).select('_id');
    if (!existing) {
      return slug;
    }

    counter += 1;
    slug = `${base}-${counter}`;
  }
};
