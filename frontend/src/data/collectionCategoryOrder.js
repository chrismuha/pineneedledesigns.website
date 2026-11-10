export const collectionCategoryOrder = [
  {
    title: 'Clothing Collections',
    slugs: ['jackets', 'shirts', 'shoes', 'vests', 'upcycled-collaboration', 'upcycled-denim'],
  },
  {
    title: 'JEWELRY',
    slug: 'jewelry',
    slugs: ['necklaces', 'bracelets', 'earrings'],
    includeEmpty: true,
    preserveOrder: true,
  },
  {
    title: 'BAGS',
    catalogTitle: 'Purses & Bags',
    slug: 'bags',
    slugs: ['myra', 'adirondack-chic', 'upcycled-logo'],
    labels: { myra: 'Myra', 'upcycled-logo': 'Upcycled Logos' },
    includeEmpty: true,
    preserveOrder: true,
  },
  {
    title: 'PANTS',
    slug: 'pants',
    slugs: ['jeans', 'shorts'],
    includeEmpty: true,
    preserveOrder: true,
  },
  {
    title: 'Accessories',
    slugs: ['cuffs', 'hat-bands', 'boot-bands'],
  },
  {
    title: 'Specialty Collections',
    slugs: ['adirondack-bridal', 'pooch-smooches', 'chic-jewelry'],
  },
];

export const buildCollectionGroups = (pages) => {
  const bySlug = new Map(pages.filter((page) => !page.hidden).map((page) => [page.slug, page]));
  const groupedSlugs = new Set([...collectionCategoryOrder.flatMap((group) => group.slugs), 'purses']);
  const byTitle = (left, right) => left.title.localeCompare(right.title, undefined, { numeric: true, sensitivity: 'base' });
  const groups = collectionCategoryOrder.map((group) => {
    const collections = group.slugs.map((slug) => bySlug.get(slug))
      .filter((page) => page && (group.includeEmpty || page.count > 0 || page.showWhenEmpty))
      .map((page) => ({ ...page, title: group.labels?.[page.slug] || page.title }));
    return { ...group, collections: group.preserveOrder ? collections : collections.sort(byTitle) };
  });
  groups.push({ title: 'Other Collections', collections: [...bySlug.values()]
    .filter((page) => !groupedSlugs.has(page.slug) && (page.count > 0 || page.showWhenEmpty)).sort(byTitle) });
  return groups.filter((group) => group.collections.length > 0);
};

// The storefront starts with product types. Brand/type collections remain one
// click below their section, and their existing dashboard filters stay intact.
export const buildCatalogSections = (pages) => {
  const groups = buildCollectionGroups(pages);
  const categoryGroups = groups.filter((group) => group.slug);
  const categoryMembers = new Set(categoryGroups.flatMap((group) => group.slugs));
  const sections = categoryGroups.map((group) => ({
    slug: group.slug,
    title: group.catalogTitle || group.title,
    navTitle: group.title,
    path: `/collections/${group.slug}`,
    cardImage: group.collections.find((page) => page.count > 0 && page.cardImage)?.cardImage || '',
    count: group.collections.reduce((count, page) => count + page.count, 0),
    children: group.collections,
    summary: group.collections.map((page) => page.title).join(' · '),
  }));
  sections.push(...groups.flatMap((group) => group.collections)
    .filter((page) => !categoryMembers.has(page.slug) && page.slug !== 'chic-jewelry'));
  const primaryOrder = ['bags', 'jewelry', 'jackets', 'pants'];
  return sections.sort((left, right) => {
    const leftIndex = primaryOrder.indexOf(left.slug);
    const rightIndex = primaryOrder.indexOf(right.slug);
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? primaryOrder.length : leftIndex)
        - (rightIndex === -1 ? primaryOrder.length : rightIndex);
    }
    return left.title.localeCompare(right.title, undefined, { numeric: true, sensitivity: 'base' });
  });
};

export const buildCollectionNavLinks = (links, pages) => {
  if (!pages.length) return links;
  return [
    ...links.filter((link) => !link.slug),
    ...buildCatalogSections(pages).map((section) => ({
      label: section.navTitle || section.title,
      path: section.path,
      children: section.children?.map((page) => ({ label: page.title, path: page.path })),
    })),
  ];
};
