export const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Adirondack Bridal', path: '/collections/adirondack-bridal' },
  { label: 'Boot Bands', path: '/collections/boot-bands' },
  { label: 'Bracelets', path: '/collections/bracelets' },
  { label: 'Chic Jewelry', path: '/collections/chic-jewelry' },
  { label: 'Cuffs', path: '/collections/cuffs' },
  { label: 'Earrings', path: '/collections/earrings' },
  { label: 'Hat Bands', path: '/collections/hat-bands' },
  { label: 'Jackets', path: '/collections/jackets' },
  { label: 'Jeans', path: '/collections/jeans' },
  { label: 'Necklaces', path: '/collections/necklaces' },
  { label: 'Pooch Smooches', path: '/collections/pooch-smooches' },
  { label: 'Purses', path: '/collections/purses' },
  { label: 'Shirts', path: '/collections/shirts' },
  { label: 'Shorts', path: '/collections/shorts' },
  { label: 'Upcycled Denim', path: '/collections/upcycled-denim' },
  { label: 'Vests', path: '/collections/vests' },
]

const collectionSlugs = [
  // 'adirondack-bridal',
  'boot-bands',
  'bracelets',
  'chic-jewelry',
  'cuffs',
  'earrings',
  'hat-bands',
  'jackets',
  'jeans',
  'necklaces',
  'pooch-smooches',
  'purses',
  'shirts',
  'shorts',
  'upcycled-denim',
  'vests',
]

const collectionMeta = {
  // 'adirondack-bridal': { count: 0, cardImage: '/images/comingsoon/adkbridalcomingsoon.webp' },
  'boot-bands': { count: 0, cardImage: '/images/adirondack-chic/seasonal-adirondack-chic/whitechristmasboots.webp' },
  'bracelets': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'chic-jewelry': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'cuffs': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'earrings': { count: 2, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'hat-bands': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'jackets': { count: 2, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'jeans': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'necklaces': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'pooch-smooches': { count: 0, cardImage: '/images/poochsmooches/Polaris-and-Luna_1.webp' },
  'purses': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'shirts': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'shorts': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'upcycled-denim': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
  'vests': { count: 0, cardImage: '/images/comingsoon/comingsoon2.webp' },
}

const defaultCollectionProducts = [
  {
    title: 'Sample Product 1',
    description: 'A handcrafted piece with unique texture.',
    meta: 'Price: $ – Size: TBD',
    images: ['/images/comingsoon/adkbridalcomingsoon.webp'],
  },
  {
    title: 'Sample Product 2',
    description: 'A one-of-a-kind style with refined details.',
    meta: 'Price: $ – Size: TBD',
    images: ['/images/comingsoon/adkbridalcomingsoon.webp'],
  },
  {
    title: 'Sample Product 3',
    description: 'Comfortable, stylish, and ready to wear.',
    meta: 'Price: $ – Size: TBD',
    images: ['/images/comingsoon/adkbridalcomingsoon.webp'],
  },
]

export const collectionPages = collectionSlugs.map((slug, index) => ({
  slug,
  title: slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  path: `/collections/${slug}`,
  count: collectionMeta[slug]?.count ?? 0,
  cardImage: collectionMeta[slug]?.cardImage ?? '/images/comingsoon/comingsoon2.webp',
  description: 'Browse our curated collection of refashioned designs.',
  previous: index > 0 ? collectionSlugs[index - 1] : null,
  next: index < collectionSlugs.length - 1 ? collectionSlugs[index + 1] : null,
  products: defaultCollectionProducts,
}))

export const homeSections = [
  {
    id: 'adirondack-bridal',
    title: 'Adirondack Bridal Collection',
    path: '/collections/adirondack-bridal',
    cards: [
      {
        pill: 'Beaded Bracelet',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/comingsoon/adkbridalcomingsoon.webp',
        alt: 'Beaded bracelet',
      },
      {
        pill: 'Denim Skirt',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/comingsoon/adkbridalcomingsoon.webp',
        alt: 'Denim skirt',
      },
      {
        pill: 'Moonlit Bloom',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/comingsoon/adkbridalcomingsoon.webp',
        alt: 'Moonlit Bloom',
      },
      {
        pill: 'Prairie Whispers',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/comingsoon/adkbridalcomingsoon.webp',
        alt: 'Prairie Whispers',
      },
      {
        pill: 'Statement Tote',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/comingsoon/adkbridalcomingsoon.webp',
        alt: 'Statement tote',
      },
      {
        pill: 'Textured Jacket',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/comingsoon/adkbridalcomingsoon.webp',
        alt: 'Textured jacket',
      },
    ],
  },
  {
    id: 'pooch-smooches',
    title: 'The Pooch Smooches Collection',
    path: '/collections/pooch-smooches',
    cards: [
      {
        pill: 'Bandanas',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/poochsmooches/Polaris-and-Luna_1.webp',
        alt: 'Bandana',
      },
      {
        pill: 'Head Bands',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/poochsmooches/Polaris-and-Luna_1.webp',
        alt: 'Head Bands',
      },
      {
        pill: 'Beaded Vest',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/poochsmooches/Polaris-and-Luna_1.webp',
        alt: 'Beaded Vest',
      },
      {
        pill: 'Placeholder Item Card',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/poochsmooches/Polaris-and-Luna_1.webp',
        alt: 'Bridal Jacket',
      },
      {
        pill: 'Placeholder Item Card',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/poochsmooches/Polaris-and-Luna_1.webp',
        alt: 'Statement Jacket',
      },
      {
        pill: 'Placeholder Item Card',
        title: 'Placeholder Item',
        meta: 'Price: $ • Size: TBD',
        price: '$0.00',
        description: 'Brief Description',
        image: '/images/poochsmooches/Polaris-and-Luna_1.webp',
        alt: 'Statement Jeans',
      },
    ],
  },
]

export const otherCollections = collectionPages.map((collection) => ({
  slug: collection.slug,
  title: collection.title,
  path: collection.path,
  cardImage: collection.cardImage,
  count: collection.count,
}))

export const sliderSlides = [
  {
    images: ['/images/1a.webp', '/images/2b.webp', '/images/3.webp'],
    alt: 'Featured collection preview',
  },
  {
    images: ['/images/4.webp'],
    alt: 'Featured design highlight',
  },
  {
    images: ['/images/5.webp'],
    alt: 'Featured product highlight',
  },
]

export const sitePages = [
  {
    slug: 'about',
    path: '/about',
    title: 'About Pine Needle Designs',
    content: `
      <p>Pine Needle Designs crafts unique, upcycled clothing and accessories that blend boho spirit with sophisticated tailoring.</p>
      <p>Every piece is made in the USA using responsibly sourced denim, vintage trims, and artisan-made embellishments.</p>
      <p>Our studio is rooted in confident expression: we build garments to feel like celebration outfits for every body.</p>
      <p>We believe in slow design, hand-finishing details, and giving unused textiles a new life so you can wear something genuinely one-of-a-kind.</p>
    `,
  },
  {
    slug: 'collections',
    path: '/collections',
    title: 'Collections',
    content: `<p>Explore the full collection catalogue and discover one-of-a-kind clothing, jewelry, handbags, and more.</p>`,
  },
  {
    slug: 'privacy-policy',
    path: '/privacy-policy',
    title: 'Privacy Policy',
    content: `<p>This website does not collect personal data beyond standard analytics and cookies.</p>`,
  },
  {
    slug: 'refund-policy',
    path: '/refund-policy',
    title: 'Refund Policy',
    content: `<p>All sales are final unless otherwise agreed for special orders.</p>`,
  },
  {
    slug: 'shipping-policy',
    path: '/shipping-policy',
    title: 'Shipping Policy',
    content: `<p>We ship domestically and internationally using standard carriers.</p>`,
  },
  {
    slug: 'terms-of-service',
    path: '/terms-of-service',
    title: 'Terms of Service',
    content: `<p>Use of this site is subject to our standard terms and conditions.</p>`,
  },
]

