const collectionNavLinks = [
  { label: 'Adirondack Bridal', path: '/collections/adirondack-bridal', slug: 'adirondack-bridal' },
  { label: 'Boot Bands', path: '/collections/boot-bands', slug: 'boot-bands' },
  { label: 'Bracelets', path: '/collections/bracelets', slug: 'bracelets' },
  { label: 'Chic Jewelry', path: '/collections/chic-jewelry', slug: 'chic-jewelry' },
  { label: 'Cuffs', path: '/collections/cuffs', slug: 'cuffs' },
  { label: 'Denim & Lace', path: '/collections/denim-and-lace', slug: 'denim-and-lace' },
  { label: 'Earrings', path: '/collections/earrings', slug: 'earrings' },
  { label: 'Hat Bands', path: '/collections/hat-bands', slug: 'hat-bands' },
  { label: 'Jackets', path: '/collections/jackets', slug: 'jackets' },
  { label: 'Jeans', path: '/collections/jeans', slug: 'jeans' },
  { label: 'Necklaces', path: '/collections/necklaces', slug: 'necklaces' },
  { label: 'Pooch Smooches', path: '/collections/pooch-smooches', slug: 'pooch-smooches' },
  { label: 'Purses', path: '/collections/purses', slug: 'purses' },
  { label: 'Shirts', path: '/collections/shirts', slug: 'shirts' },
  { label: 'Shorts', path: '/collections/shorts', slug: 'shorts' },
  { label: 'Summer/Fall', path: '/collections/summer-fall', slug: 'summer-fall' },
  { label: 'Upcycled Denim', path: '/collections/upcycled-denim', slug: 'upcycled-denim' },
  { label: 'Vests', path: '/collections/vests', slug: 'vests' },
  { label: 'Winter/Spring', path: '/collections/winter-spring', slug: 'winter-spring' },
]

export const collectionPages = [
  {
    slug: 'adirondack-bridal',
    title: 'Adirondack Bridal Collection',
    path: '/collections/adirondack-bridal',
    count: 0,
    cardImage: '/images/comingsoon/adkbridalcomingsoon.webp',
    description: 'Hand-cut denim, luxe trims, and mountain-ready detailing designed for the bold bride who loves heritage craft and unexpected glamour.',
    products: [
      /*
      {
        id: 1,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'image-frame',
        imageCount: 1,
      },
      */
    ],
  },
  {
    slug: 'boot-bands',
    title: 'Boot Bands',
    path: '/collections/boot-bands',
    count: 0,
    cardImage: '/images/adirondack-chic/seasonal-adirondack-chic/whitechristmasboots.webp',
    description: 'Studded detail for every boot.',
    products: [
      /*
      {
        id: 4,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'bracelets',
    title: 'Bracelets',
    path: '/collections/bracelets',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Handwoven metals for texture.',
    products: [
      /*
      {
        id: 6,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'chic-jewelry',
    title: 'Chic Jewelry',
    path: '/collections/chic-jewelry',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Mixed metals with delicate stones.',
    products: [
      /*
      {
        id: 8,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'cuffs',
    title: 'Cuffs',
    path: '/collections/cuffs',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Bold silhouette with tactile finish.',
    products: [
      /*
      {
        id: 14,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'earrings',
    title: 'Earrings',
    path: '/collections/earrings',
    count: 1,
    cardImage: '/images/ear-rings/ear-rings-1a.webp',
    description: 'Description of Earring 1',
    products: [
      {
        id: 10,
        title: 'Red Flower',
        price: 38,
        meta: ['Price: $38', 'Size: TBD'],
        description: 'Description of Earring 1',
        images: [
          '/images/ear-rings/ear-rings-1a.webp',
          '/images/ear-rings/ear-rings-2a.webp',
          '/images/ear-rings/ear-rings-2b.webp',
          '/images/ear-rings/ear-rings-2c.webp',
          '/images/ear-rings/ear-rings-2d.webp',
        ],
        imageWrapper: 'image-frame',
      },
    ],
  },
  {
    slug: 'hat-bands',
    title: 'Hat Bands',
    path: '/collections/hat-bands',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Feather accents with beaded thread.',
    products: [
      /*
      {
        id: 16,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'jackets',
    title: 'Jackets',
    path: '/collections/jackets',
    count: 2,
    cardImage: '/images/one-offs/jackets/ruby-lee/ruby-lee-1a.webp',
    description: "This patriotic jean jacket is the ultimate tribute to classic Americana. Re-designed with satin, lace, fringe, and star studs and amber stones. Designed for the salute to America.",
    products: [
      {
        id: 12,
        title: "America She's Beautiful",
        price: 214,
        meta: ['Price: $214.00 plus sales tax with free shipping', 'Size: ML'],
        description: "This patriotic jean jacket is the ultimate tribute to classic Americana. Re-designed with satin, lace, fringe, and star studs and amber stones. Designed for the salute to America.",
        images: ['/images/jackets/jacket1a.webp', '/images/jackets/jacket1b.webp'],
        imageWrapper: 'image-frame',
      },
      {
        id: 13,
        title: 'Statement Jacket 2',
        price: 180,
        meta: ['Price: $', 'Size: TBD'],
        description: 'Textured fibers and dramatic silhouette.',
        images: ['/images/jackets/jacket2a.webp'],
        imageWrapper: 'image-frame',
      },
      {
        id: 37,
        title: 'Ruby Lee',
        price: 264,
        meta: ['Price: $264', 'Size: M/L'],
        description: 'She is an upcycled Jean jacket. Ruby Lee loves her gold brooches and bright ribbon trims mixed with red and clear beaded dangles of crystals. She has flowers of red burgundy and cream roses all appliquéd on her back. And a matching burgundy mesh peplum of mermaid sequins at the waist. Cuffs are turned up and pockets are removed for more embellishments. A lower long narrow pocket was added with a butterfly brooch. Keeping with her rustic nature, the denim is very soft but her bougie attitude shows off ivory fringe and multiple laces. A red plaid buck brings it all together. Definitely Adirondack Chic! Where she lives.',
        images: [
          '/images/one-offs/jackets/ruby-lee/ruby-lee-1a.webp',
          '/images/one-offs/jackets/ruby-lee/ruby-lee-1b.webp',
        ],
        videos: [
          '/videos/one-offs/jackets/ruby-lee1a.webm',
          '/videos/one-offs/jackets/ruby-lee1b.webm',
        ],
        imageWrapper: 'image-frame',
      },
    ],
  },
  {
    slug: 'jeans',
    title: 'Jeans',
    path: '/collections/jeans',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Sculpted fit with vintage wash.',
    products: [
      /*
      {
        id: 18,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'necklaces',
    title: 'Necklaces',
    path: '/collections/necklaces',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Mix of chains and charms.',
    products: [
      /*
      {
        id: 20,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'pooch-smooches',
    title: 'The Pooch Smooches Collection',
    path: '/collections/pooch-smooches',
    count: 0,
    cardImage: '/images/poochsmooches/Polaris-and-Luna_1.webp',
    description: 'Bandanas, collars, and keepsakes made to celebrate the snuggly pals who are already obsessed with hugs.',
    products: [
      /*
      {
        id: 22,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'image-frame',
        imageCount: 1,
      },
      */
    ],
  },
  {
    slug: 'shirts',
    title: 'Shirts',
    path: '/collections/shirts',
    count: 0,
    cardImage: '/images/one-offs/shirts/wende-choice/wende-choice_1a.webp',
    description: 'Blinged out shirts and sweatshirts made to stand out.',
    products: [
      {
        id: 38,
        title: "Wende's Choice Blinged Out Sweatshirt",
        price: 58,
        meta: ['Price: $58', 'Shown in Sand, Available in White.'],
        description: "WENDE's CHOICE! On a Bad Day There's ALWAYS Lipstick! Blinged out sweatshirt in the color Sand. Also comes in white.",
        options: [
          {
            name: 'Size',
            values: ['Small', 'Medium', 'Large', 'XL', '2X', '3X'],
            placeholder: 'Select size',
          },
          {
            name: 'Color',
            values: ['Sand', 'White'],
            placeholder: 'Select color',
          },
        ],
        images: [
          '/images/one-offs/shirts/wende-choice/wende-choice_1a.webp',
          '/images/one-offs/shirts/wende-choice/wende-choice_1b.webp',
        ],
        videos: ['/videos/one-offs/shirts/wende-choice/wende-choice.webm'],
        imageWrapper: 'image-frame',
      },
      {
        id: 39,
        title: 'Blinged Out T-Shirt',
        price: 38,
        meta: ['Price: $38', 'Shown in Sand, Available in White.'],
        description: 'Turquoise Chick is blinged out with fused on rhinestones on her cowboy hat and parts of her jewelry. Rustic and Chic.',
        options: [
          {
            name: 'Size',
            values: ['Small', 'Medium', 'Large', 'XL', '2X', '3X'],
            placeholder: 'Select size',
          },
          {
            name: 'Color',
            values: ['Sand', 'White'],
            placeholder: 'Select color',
          },
        ],
        images: [
          '/images/one-offs/shirts/blinged-out-tshirt/blinged-out-tshirt-1a.webp',
          '/images/one-offs/shirts/blinged-out-tshirt/blinged-out-tshirt-1b.webp',
        ],
        videos: ['/videos/one-offs/shirts/blinged-out-tshirt/blinged-out-tshirt.webm'],
        imageWrapper: 'image-frame',
      },
      {
        id: 40,
        title: "Don't Burst My Bubble T-Shirt",
        price: 38,
        meta: ['Price: $38', 'Shown in Sand, Available in Pink or White.'],
        description: "A Cowgirl with Attitude. Of course she's all blinged out!",
        options: [
          {
            name: 'Size',
            values: ['Small', 'Medium', 'Large', 'XL', '2X', '3X'],
            placeholder: 'Select size',
          },
          {
            name: 'Color',
            values: ['Sand', 'Pink', 'White'],
            placeholder: 'Select color',
          },
        ],
        images: ['/images/one-offs/shirts/dont-burst-my-bubble/dont-burst-my-bubble.webp'],
        videos: ['/videos/one-offs/shirts/dont-burst-my-bubble/dont-burst-my-bubble.webm'],
        imageWrapper: 'image-frame',
      },
    ],
  },
  {
    slug: 'purses',
    title: 'Purses',
    path: '/collections/purses',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Structured shape with mixed leather.',
    products: [
      /*
      {
        id: 25,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'shorts',
    title: 'Shorts',
    path: '/collections/shorts',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'A-line shape with luxe hardware.',
    products: [
      /*
      {
        id: 29,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'denim-and-lace',
    title: 'Denim & Lace',
    path: '/collections/denim-and-lace',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Limited-run upcycled pieces crafted to stand out.',
    products: [
      {
        id: 34,
        title: 'Placeholder Item',
        placeholder: true,
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'image-frame',
        imageCount: 1,
        placeholderImage: '/images/comingsoonz.webp',
      },
      {
        id: 35,
        title: 'Placeholder Item',
        placeholder: true,
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'image-frame',
        imageCount: 1,
        placeholderImage: '/images/comingsoonz.webp',
      },
    ],
  },
  {
    slug: 'upcycled-denim',
    title: 'Upcycled Denim',
    path: '/collections/upcycled-denim',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'One-of-a-kind patchwork silhouette.',
    products: [
      /*
      {
        id: 31,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'summer-fall',
    title: 'Summer/Fall',
    path: '/collections/summer-fall',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Warm-weather statement pieces and early-order seasonal favorites.',
    products: [
      {
        id: 50,
        title: 'Placeholder Item',
        placeholder: true,
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'image-frame',
        imageCount: 1,
        placeholderImage: '/images/comingsoonz.webp',
      },
      {
        id: 51,
        title: 'Placeholder Item',
        placeholder: true,
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'image-frame',
        imageCount: 1,
        placeholderImage: '/images/comingsoonz.webp',
      },
    ],
  },
  {
    slug: 'vests',
    title: 'Vests',
    path: '/collections/vests',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: 'Edgy layers with artisanal trim.',
    products: [
      /*
      {
        id: 33,
        title: 'Placeholder Item',
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'placeholder',
        imagePlaceholders: ['placeholder'],
      },
      */
    ],
  },
  {
    slug: 'winter-spring',
    title: 'Winter/Spring',
    path: '/collections/winter-spring',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon2.webp',
    description: "Cold-weather favorites and spring pieces we can't stop thinking about.",
    products: [
      {
        id: 52,
        title: 'Placeholder Item',
        placeholder: true,
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'image-frame',
        imageCount: 1,
        placeholderImage: '/images/comingsoonz.webp',
      },
      {
        id: 53,
        title: 'Placeholder Item',
        placeholder: true,
        price: 'TBD',
        meta: ['Price: TBD', 'Size: TBD'],
        description: 'Placeholder description.',
        imageWrapper: 'image-frame',
        imageCount: 1,
        placeholderImage: '/images/comingsoonz.webp',
      },
    ],
  },
]

collectionPages.forEach((page) => {
  page.count = page.products.filter((product) => !product.placeholder).length
  page.previous = null
  page.next = null
})

export const visibleCollectionPages = collectionPages.filter((page) => page.count > 0 && !page.hidden)
const visibleCollectionSlugs = new Set(visibleCollectionPages.map((page) => page.slug))

visibleCollectionPages.forEach((page, index) => {
  page.previous = index > 0 ? visibleCollectionPages[index - 1].slug : null
  page.next = index < visibleCollectionPages.length - 1 ? visibleCollectionPages[index + 1].slug : null
})

export const navLinks = [
  { label: 'Home', path: '/' },
  ...collectionNavLinks
    .filter((link) => visibleCollectionSlugs.has(link.slug))
    .map(({ label, path }) => ({ label, path })),
]

const allHomeSections = [
  {
    id: 'adirondack-bridal',
    title: 'Adirondack Bridal Collection',
    path: '/collections/adirondack-bridal',
    cards: [
      /*
      {
        pill: 'Placeholder Item Card',
        title: 'Placeholder Item',
        meta: 'Price: TBD • Size: TBD',
        price: 'TBD',
        description: 'Brief Description',
        image: '/images/comingsoon/adkbridalcomingsoon.webp',
        alt: 'Placeholder item',
      },
      */
    ],
  },
  {
    id: 'pooch-smooches',
    title: 'The Pooch Smooches Collection',
    path: '/collections/pooch-smooches',
    cards: [
      /*
      {
        pill: 'Placeholder Item Card',
        title: 'Placeholder Item',
        meta: 'Price: TBD • Size: TBD',
        price: 'TBD',
        description: 'Brief Description',
        image: '/images/poochsmooches/Polaris-and-Luna_1.webp',
        alt: 'Placeholder item',
      },
      */
    ],
  },
]

export const homeSections = allHomeSections.filter(
  (section) => visibleCollectionSlugs.has(section.id) && section.cards.length > 0
)

export const otherCollections = visibleCollectionPages.map((collection) => ({
  slug: collection.slug,
  title: collection.title,
  path: collection.path,
  cardImage: collection.cardImage,
  count: collection.count,
}))

export const sliderSlides = [
  {
    images: ['/images/1a.webp'],
    alt: 'Featured collection preview',
  },
  {
    images: ['/images/2b.webp'],
    alt: 'Featured collection preview',
  },
  {
    images: ['/images/3.webp'],
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
