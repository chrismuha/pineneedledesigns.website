const collectionNavLinks = [
  { label: 'Adirondack Bridal', path: '/collections/adirondack-bridal', slug: 'adirondack-bridal' },
  { label: 'Adirondack Chic', path: '/collections/adirondack-chic', slug: 'adirondack-chic' },
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
  { label: 'Upcycled Collaboration', path: '/collections/upcycled-collaboration', slug: 'upcycled-collaboration' },
  { label: 'Upcycled Logo', path: '/collections/upcycled-logo', slug: 'upcycled-logo' },
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
    slug: 'adirondack-chic',
    title: 'Adirondack Chic',
    path: '/collections/adirondack-chic',
    count: 0,
    showWhenEmpty: true,
    cardImage: '/images/adirondack-chic-collection/torquoise-white-speedy-bag/turquoise-white-speedy-bag1.webp',
    cardImageFromProduct: true,
    description: 'Country-chic Adirondack style with rustic textures, bold details, and handcrafted attitude.',
    products: [
      {
        id: 58,
        title: 'Turquoise and White Leather Speedy Bag',
        price: 230,
        meta: ['Price: $230', 'Size: Small', 'Size: Large (SOLD)'],
        description: 'Great for us turquoise gals! Adirondack Chic.',
        images: [
          '/images/adirondack-chic-collection/torquoise-white-speedy-bag/turquoise-white-speedy-bag1.webp',
          '/images/adirondack-chic-collection/torquoise-white-speedy-bag/turquoise-white-speedy-bag2.webp',
          '/images/adirondack-chic-collection/torquoise-white-speedy-bag/turquoise-white-speedy-bag3.webp',
        ],
        imageWrapper: 'image-frame',
      },
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
    cardImage: '/images/comingsoon/comingsoon1.webp',
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
    cardImage: '/images/comingsoon/comingsoon001.webp',
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
    cardImage: '/images/comingsoon/comingsoon002.webp',
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
          '/images/one-offs/jackets/ruby-lee/ruby-lee-1c.webp',
          '/images/one-offs/jackets/ruby-lee/ruby-lee-1d.webp',
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
    cardImage: '/images/comingsoon/comingsoon003.webp',
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
    cardImage: '/images/comingsoon/comingsoon004.webp',
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
    description: 'Blinged Out T-Shirts and Sweatshirts made to stand out.',
    products: [
      {
        id: 38,
        title: 'On a Bad Day there’s Always Lipstick Blinged Out Sweatshirt',
        price: 58,
        meta: ['Price: $58', 'Available in Peach, Natural, Sand, and White.'],
        description: "WENDE's CHOICE! On a Bad Day There's ALWAYS Lipstick! Blinged Out sweatshirt. Comes in Peach, Natural, Sand, and White.",
        options: [
          {
            name: 'Size',
            values: ['Small', 'Medium', 'Large', 'XL', '2X', '3X'],
            placeholder: 'Select size',
          },
          {
            name: 'Color',
            values: ['Peach', 'Natural', 'Sand', 'White'],
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
        title: 'Turquoise Chic Blinged Out T-Shirt',
        price: 38,
        meta: ['Price: $38', 'Available in Peach, Natural, Pink, Sand, and White.'],
        description: 'Turquoise Chick is Blinged Out with fused on rhinestones on her cowboy hat and parts of her jewelry. Rustic and Chic.',
        options: [
          {
            name: 'Size',
            values: ['Small', 'Medium', 'Large', 'XL', '2X', '3X'],
            placeholder: 'Select size',
          },
          {
            name: 'Color',
            values: ['Peach', 'Natural', 'Pink', 'Sand', 'White'],
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
        title: "Don't Burst My Bubble Blinged Out T-Shirt",
        price: 38,
        meta: ['Price: $38', 'Available in Peach, Natural, Pink, Sand, and White.'],
        description: "A Cowgirl with Attitude. Of course she's all Blinged Out!",
        options: [
          {
            name: 'Size',
            values: ['Small', 'Medium', 'Large', 'XL', '2X', '3X'],
            placeholder: 'Select size',
          },
          {
            name: 'Color',
            values: ['Peach', 'Natural', 'Pink', 'Sand', 'White'],
            placeholder: 'Select color',
          },
        ],
        images: ['/images/one-offs/shirts/dont-burst-my-bubble/dont-burst-my-bubble.webp'],
        videos: ['/videos/one-offs/shirts/dont-burst-my-bubble/dont-burst-my-bubble.webm'],
        imageWrapper: 'image-frame',
      },
      {
        id: 63,
        title: 'Cowgirl Concert Goer',
        price: 38,
        meta: ['Price: $38', 'Sizes: S-3X', 'Comes in white, grey, sand, natural, and pink.'],
        description: 'Blinged out Tshirt.',
        options: [
          {
            name: 'Size',
            values: ['Small', 'Medium', 'Large', 'XL', '2X', '3X'],
            placeholder: 'Select size',
          },
          {
            name: 'Color',
            values: ['White', 'Grey', 'Sand', 'Natural', 'Pink'],
            placeholder: 'Select color',
          },
        ],
        images: ['/images/one-offs/shirts/cowgirl-concert-goer/cowgirl-concert-goer1.webp'],
        imageWrapper: 'image-frame',
      },
      {
        id: 64,
        title: 'Guts, Grit And Lipstick Blinged Out T-Shirt',
        price: 38,
        meta: ['Price: $38', 'Sizes: S-3X', 'Comes in white, peach, pink, sand, and natural.'],
        description: 'Blinged out T-Shirt.',
        options: [
          {
            name: 'Size',
            values: ['Small', 'Medium', 'Large', 'XL', '2X', '3X'],
            placeholder: 'Select size',
          },
          {
            name: 'Color',
            values: ['White', 'Peach', 'Pink', 'Sand', 'Natural'],
            placeholder: 'Select color',
          },
        ],
        images: ['/images/one-offs/shirts/guts-grit-lipstick/guts-grit-lipstick1.webp'],
        imageWrapper: 'image-frame',
      },
    ],
  },
  {
    slug: 'purses',
    title: 'Purses',
    path: '/collections/purses',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon005.webp',
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
    cardImage: '/images/comingsoon/comingsoon006.webp',
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
    cardImage: '/images/whimsical-fairy/crownb.webp',
    description: 'Limited-run upcycled pieces crafted to stand out.',
    products: [
      {
        id: 34,
        title: 'The Crowned Hare Vest',
        price: 77,
        meta: ['Price: $77', 'Size: M/L'],
        description: 'This bunny is picture perfect with her resting in the woods of the Adirondacks wearing her crown of gold and rhinestones. 2 gold flower brooches popping out. Chain of gold leaves and rainbow crystals shine down on her. Rust embroidery travel around the denim vest. Lace and pearls outline the hem and neck. 2 front pockets are trimmed in either pearls and lace or stamped ink trees and a chain of leaves and crystals. One of a kind Country Chic or Whimsical Fairy.',
        images: [
          '/images/whimsical-fairy/crowna.webp',
          '/images/whimsical-fairy/crownb.webp',
          '/images/whimsical-fairy/crownc.webp',
          '/images/whimsical-fairy/whim1.webp',
          '/images/whimsical-fairy/whim2.webp',
          '/images/whimsical-fairy/whim3.webp',
          '/images/whimsical-fairy/whim4.webp',
          '/images/whimsical-fairy/whim5.webp',
          '/images/whimsical-fairy/whim6.webp',
        ],
        videos: ['/videos/whimsical-fairy/whim.webm'],
        imageWrapper: 'image-frame',
      },
      {
        id: 41,
        title: 'Bracelet Brandi',
        price: 29,
        meta: ['Price: $29', 'Size: 7 to 7.5"'],
        description: 'Brandi is a bracelet with a denim band. She is trimmed in lace flowers and has an ivory floral brooch with 3 large pearls and scattered rhinestones. Attached is bridal leaf lace with a triple circle and tiny rhinestones.',
        images: [
          '/images/denimlace/brandybracelet/brandybracelet1.webp',
          '/images/denimlace/brandybracelet/brandybracelet2.webp',
          '/images/denimlace/brandybracelet/brandybracelet3.webp',
          '/images/denimlace/brandybracelet/brandybracelet4.webp',
          '/images/denimlace/brandybracelet/brandybracelet5.webp',
        ],
        videos: ['/videos/denimlace/brandybracelet/braceletbrandy.webm'],
        imageWrapper: 'image-frame',
      },
      {
        id: 62,
        title: 'Adeline Bracelet',
        price: 32,
        meta: ['Price: $32', 'Size: 7-8"', 'Stretches to 8"'],
        description: 'Adeline is a country chic bracelet. Denim, lace, pink chiffon, and a matching rose colored cameo. Trimmed in gold boucle ribbon and a string of pearls. Fastens in the back with a pearl flower and centered rhinestone. Closure is a corded elastic. Adeline stretches to 8".',
        images: [
          '/images/denimlace/adelinebracelet/adeline-bracelet-1.webp',
          '/images/denimlace/adelinebracelet/adeline-bracelet-2.webp',
          '/images/denimlace/adelinebracelet/adeline-bracelet-3.webp',
          '/images/denimlace/adelinebracelet/adeline-bracelet-4.webp',
        ],
        videos: [
          '/videos/denimlace/adelinebracelet/adeline-bracelet-01.webm',
          '/videos/denimlace/adelinebracelet/adeline-bracelet-02.webm',
        ],
        imageWrapper: 'image-frame',
      },
    ],
  },
  {
    slug: 'upcycled-collaboration',
    title: 'Upcycled Collaboration',
    path: '/collections/upcycled-collaboration',
    count: 1,
    cardImage: '/images/upcycled-collaboration/adirondack-chic-leather-cowhide-overnight-duffel-bag/cowhide-bag1.webp',
    cardImageFromProduct: true,
    description: 'Collaborative upcycled pieces with country-chic materials and handcrafted details.',
    products: [
      {
        id: 55,
        title: 'Adirondack Chic Leather and Cowhide Overnight Duffel Bag',
        price: 160,
        meta: ['Price: $160'],
        maker: 'Made by jGypsie',
        description: 'A definite for traveling and weekend stays.',
        images: [
          '/images/upcycled-collaboration/adirondack-chic-leather-cowhide-overnight-duffel-bag/cowhide-bag1.webp',
          '/images/upcycled-collaboration/adirondack-chic-leather-cowhide-overnight-duffel-bag/cowhide-bag2.webp',
          '/images/upcycled-collaboration/adirondack-chic-leather-cowhide-overnight-duffel-bag/cowhide-bag3.webp',
          '/images/upcycled-collaboration/adirondack-chic-leather-cowhide-overnight-duffel-bag/cowhide-bag4.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 61,
        title: 'Leather Fanny Pack with Fringe',
        price: 99,
        meta: ['Price: $99'],
        description: 'Upcycled leather and made by jGypsie in the USA. Convenient back zipper pocket. Great for a day at the rodeo or horse show! You decide.',
        images: [
          '/images/upcycled-collaboration/leather-fanny-pack/leather-fanny-pack1-1.webp',
          '/images/upcycled-collaboration/leather-fanny-pack/leather-fanny-pack1-2.webp',
          '/images/upcycled-collaboration/leather-fanny-pack/leather-fanny-pack1-3.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 56,
        title: 'Cowhide Leather Checkered Wallet Wristlet',
        price: 69,
        meta: ['Price: $69', 'Color: Orchid', 'Size: 3.5" x 5"', 'Upcycled by j.Gypsie', 'Made in the USA'],
        description: 'Upcycled by j.Gypsie. Made in the USA. Comes with leather wrist strap. Folds down to 3.5" x 5". What is more country chic than leather and cowhide? Cute!',
        images: [
          '/images/upcycled-collaboration/cowhide-leather-wallet-wristlet/cowhide-wristlet1.webp',
          '/images/upcycled-collaboration/cowhide-leather-wallet-wristlet/cowhide-wristlet2.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 65,
        title: 'Pink Tooled Leather Speedy Bag by jGypsie',
        price: 189,
        meta: ['Price: $189', 'Made by jGypsie'],
        description: 'Whether you are country Western or Adirondack Chic this bag is perfect for femininity and rustic style.',
        images: [
          '/images/upcycled-collaboration/pink-tooled-leather-speedy-bag/pink-tooled-leather-speedy-bag1.webp',
          '/images/upcycled-collaboration/pink-tooled-leather-speedy-bag/pink-tooled-leather-speedy-bag2.webp',
        ],
        imageWrapper: 'image-frame',
      },
    ],
  },
  {
    slug: 'upcycled-logo',
    title: 'Upcycled Logo',
    path: '/collections/upcycled-logo',
    count: 1,
    cardImage: '/images/upcycled-logo/barrette-lv-leather-french-style/barrette-lv-leather-french-style1.webp',
    cardImageFromProduct: true,
    description: 'Upcycled finds reimagined as one-of-a-kind accessories and statement pieces.',
    products: [
      {
        id: 54,
        title: 'Upcycled LOGO Barrette',
        price: 49,
        meta: ['Price: $49', 'Lv leather French style', 'Hair clip brown', 'Made by jGypsie'],
        description: 'Lv leather French style. Hair clip brown. Made by jGypsie.',
        images: [
          '/images/upcycled-logo/barrette-lv-leather-french-style/barrette-lv-leather-french-style1.webp',
          '/images/upcycled-logo/barrette-lv-leather-french-style/barrette-lv-leather-french-style2.webp',
          '/images/upcycled-logo/barrette-lv-leather-french-style/barrette-lv-leather-french-style3.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 57,
        title: 'Upcycled LV Canvas Pack',
        price: 79,
        meta: ['Price: $79', 'Made by jGypsie Designs'],
        description: 'Perfect for walking with a stroller or dog leash. Made by jGypsie Designs. Fanny pack sling pack bum pack.',
        images: [
          '/images/upcycled-logo/upcycled-lv-canvas-pack/upcyled-canvas-pack1.webp',
          '/images/upcycled-logo/upcycled-lv-canvas-pack/upcyled-canvas-pack2.webp',
          '/images/upcycled-logo/upcycled-lv-canvas-pack/upcyled-canvas-pack3.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 59,
        title: 'Upcycled LV Tooled Wristlet or Makeup Bag',
        price: 88,
        meta: ['Price: $88'],
        description: 'All recycled leather and hand tooled for that Adirondack Charm! Great for country Western and North country girls alike!',
        images: [
          '/images/upcycled-logo/upcycled-makeup-bag/upcyled-makeup-bag1.webp',
          '/images/upcycled-logo/upcycled-makeup-bag/upcyled-makeup-bag2.webp',
          '/images/upcycled-logo/upcycled-makeup-bag/upcyled-makeup-bag3.webp',
          '/images/upcycled-logo/upcycled-makeup-bag/upcyled-makeup-bag4.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 60,
        title: 'The LV Cowhide Leather Fringe Western (or Adirondack) Crossbody Bag',
        price: 160,
        meta: ['Price: $160', 'Color: Rustic Charm and Feminine'],
        description: 'One of a kind. Nicely concealed back zipper pocket. Love that leather fringe.',
        images: [
          '/images/upcycled-logo/lv-cowhide-western-bag/cowhide-bag1.webp',
          '/images/upcycled-logo/lv-cowhide-western-bag/cowhide-bag2.webp',
          '/images/upcycled-logo/lv-cowhide-western-bag/cowhide-bag3.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 66,
        title: 'Upcycled Black Suede and Brown Tooled Leather Backpack',
        price: 160,
        meta: ['Price: $160', 'Color: Black suede and brown tooled leather', 'Size: TBD'],
        description: 'Of course with the Lv logo! Great for school or a hike! Stitching is the famous boot stitch.',
        images: [
          '/images/upcycled-logo/brown-tooled-leather-backpack/brown-tooled-leather-backpack1.webp',
          '/images/upcycled-logo/brown-tooled-leather-backpack/brown-tooled-leather-backpack2.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 67,
        title: 'Cowhide Lv Faux Leather Shoulder Bag',
        price: 138,
        meta: ['Price: $138', 'Color: Golden brown', 'Durable faux leather with cowhide'],
        description: 'A nice rich golden brown color with a roomy inside for an iPad and make up bag. Durable faux leather with cowhide to match. Goes perfect with Lv logo.',
        images: [
          '/images/upcycled-logo/cowhide-shoulder-bag/cowhide-shoulder-bag1.webp',
          '/images/upcycled-logo/cowhide-shoulder-bag/cowhide-shoulder-bag2.webp',
          '/images/upcycled-logo/cowhide-shoulder-bag/cowhide-shoulder-bag3.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 68,
        title: 'Upcycled LV Logo Bag',
        price: 171,
        meta: ['Price: $171', 'Pink and white checkered', 'Natural cowhide and leather fringe', "There's only one"],
        description: "This crossbody bag is pink and white checkered with natural cowhide and leather fringe. Total statement bag with that LV logo! And there's only one!",
        images: [
          '/images/upcycled-logo/upcycled-lv-logo-bag/upcycled-lv-logo-bag1.webp',
          '/images/upcycled-logo/upcycled-lv-logo-bag/upcycled-lv-logo-bag2.webp',
          '/images/upcycled-logo/upcycled-lv-logo-bag/upcycled-lv-logo-bag3.webp',
        ],
        imageWrapper: 'image-frame',
      },
      {
        id: 69,
        title: 'The Weekender Tote Bag',
        price: 98,
        meta: ['Price: $98', 'Neutral canvas tones', 'Brown leather handles'],
        description: 'Perfect neutral tones on canvas and brown leather handles. Of course you will rock it with the LV logo! Very roomy and fun with the canvas front fringe and flashy dark diamond print.',
        images: [
          '/images/upcycled-logo/weekender-tote-bag/weekender-tote-bag1.webp',
          '/images/upcycled-logo/weekender-tote-bag/weekender-tote-bag2.webp',
          '/images/upcycled-logo/weekender-tote-bag/weekender-tote-bag3.webp',
        ],
        imageWrapper: 'image-frame',
      },
    ],
  },
  {
    slug: 'upcycled-denim',
    title: 'Upcycled Denim',
    path: '/collections/upcycled-denim',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon007.webp',
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
    cardImage: '/images/comingsoon/comingsoon008.webp',
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
        placeholderImage: '/images/comingsoon/comingsoon009.webp',
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
        placeholderImage: '/images/comingsoon/comingsoon010.webp',
      },
    ],
  },
  {
    slug: 'vests',
    title: 'Vests',
    path: '/collections/vests',
    count: 0,
    cardImage: '/images/comingsoon/comingsoon011.webp',
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
    cardImage: '/images/comingsoon/comingsoon012.webp',
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
        placeholderImage: '/images/comingsoon/comingsoon013.webp',
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
        placeholderImage: '/images/comingsoon/comingsoon014.webp',
      },
    ],
  },
]

const firstProductImage = (page) =>
  page.products.find((product) => !product.placeholder && product.images?.length)?.images[0]

const freeShippingMeta = 'Free shipping'

const withFreeShippingMeta = (meta) => {
  const items = Array.isArray(meta) ? meta : [meta]
  return items.some((item) => String(item).trim().toLowerCase() === freeShippingMeta.toLowerCase())
    ? items
    : [...items, freeShippingMeta]
}

collectionPages.forEach((page) => {
  page.products.forEach((product) => {
    product.meta = withFreeShippingMeta(product.meta)
  })
  page.count = page.products.filter((product) => !product.placeholder).length
  if (page.cardImageFromProduct) {
    page.cardImage = firstProductImage(page) || page.cardImage
  }
  page.previous = null
  page.next = null
})

export const visibleCollectionPages = collectionPages.filter((page) => (page.count > 0 || page.showWhenEmpty) && !page.hidden)
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
        image: '/images/comingsoon/comingsoon025.webp',
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
  },
  {
    images: ['/images/2b.webp'],
  },
  {
    images: ['/images/3.webp'],
  },
  {
    images: ['/images/4.webp'],
  },
  {
    images: ['/images/5.webp'],
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
    content: `
      <p>Use of this site is subject to our standard terms and conditions.</p>
      <h2>Buyer Sales Tax Notice</h2>
      <p>Sales tax is applied according to New York State and local sales tax rules. Qualifying clothing and footwear items under $110 may be exempt from New York State sales tax, but local tax rules may vary outside New York City. In New York City, qualifying clothing and footwear under $110 are generally tax exempt. Clothing and footwear priced at $110 or more, taxable accessories, and non-exempt items are generally subject to the applicable sales tax rate. If sales tax is included in the listed price, it will be handled in accordance with applicable New York tax rules and shown separately on receipts where required.</p>
    `,
  },
]
