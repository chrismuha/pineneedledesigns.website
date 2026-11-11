// Dashboard history, reconstructed from main's dated source changes. No numbered
// app versions or deployment timestamps were recorded. Source commits are kept
// here for verification, rather than shown as customer-facing release metadata.
export const dashboardReleases = [
  {
    date: 'TBD',
    summary: 'Dashboard updates and a clear history of what changed.',
    sources: [],
    categories: [
      { title: 'App updates', icon: 'bi-arrow-repeat', bullets: [
        'App update prompts now follow changes to the dashboard and its shared app code, instead of appearing after every website deployment.',
        'Storefront changes, catalog content, backups, and deployment timestamps no longer create dashboard app updates.',
      ] },
      { title: 'Release notes', icon: 'bi-clock-history', bullets: [
        'Dashboard Settings now includes a dated release timeline with alphabetized categories and change bullets, plus expandable history.',
      ] },
    ],
  },
  {
    date: '2026-11-11', summary: 'Collection placements and website visibility.',
    sources: ['c6952af', '3e1c0cb'],
    categories: [
      { title: 'Collections', icon: 'bi-collection', bullets: [
        'Additional collection placements let one item appear in seasonal, holiday, or clearance collections while sharing stock, media, prices, and options.',
        'Shared items survive collection deletion and appear only once in New Arrivals.',
      ] },
      { title: 'Website visibility', icon: 'bi-eye', bullets: [
        'Show on website controls hide or restore items, collections, and sub-collections while keeping hidden content editable in the dashboard.',
        'Visibility choices survive restarts, and new items start with Show on website checked.',
      ] },
    ],
  },
  {
    date: '2026-11-10', summary: 'New Arrivals controls and reliable inventory and uploads.',
    sources: ['4e33e60', 'ddd9d07'],
    categories: [
      { title: 'Inventory', icon: 'bi-box-seam', bullets: [
        'Sold status follows quantity automatically; the read-only control explains why items with positive stock remain available.',
      ] },
      { title: 'Media', icon: 'bi-images', bullets: [
        'Photo and video uploads use readable product-based filenames and reserve unused numbers to protect retained media.',
      ] },
      { title: 'New Arrivals', icon: 'bi-stars', bullets: [
        'Choose Latest only, Latest + custom, or Custom only, with searchable picks, ordering, a homepage preview, and a show/hide switch.',
        'Set a total of one to ten items; duplicate products, sold items, missing photos, and hidden collections are skipped.',
      ] },
    ],
  },
  {
    date: '2026-11-06', summary: 'Text-only order records.', sources: ['b173588'],
    categories: [{ title: 'Orders', icon: 'bi-receipt', bullets: [
      'Order editing loads item names, prices, stock, and internal inventory references without product media.',
      'Order records exclude product media and links while preserving payment actions and inventory behavior.',
    ] }],
  },
  {
    date: '2026-09-21', summary: 'App navigation and payment-aware prompts.', sources: ['877012a', '25cbaef', '4244f0a'],
    categories: [
      { title: 'App navigation', icon: 'bi-phone', bullets: [
        'Return to the dashboard after opening the storefront from the app.',
      ] },
      { title: 'Orders', icon: 'bi-receipt', bullets: [
        'Payment-aware prompts clarify order actions.',
      ] },
    ],
  },
  {
    date: '2026-09-20', summary: 'Safer order management and login recovery.',
    sources: ['e4a4353', '19e720c', '681776f', '009262f', '68c0fd1', 'eda715f', 'a5319e7', '2ecd608'],
    categories: [
      { title: 'App recovery', icon: 'bi-shield-check', bullets: [
        'Refresh the app separately from resetting login and the Cloudflare Access session.',
      ] },
      { title: 'Items', icon: 'bi-bag', bullets: [
        'Item-only edits avoid unnecessary media uploads.',
      ] },
      { title: 'Notifications', icon: 'bi-bell', bullets: [
        'Dashboard errors use consistent notifications.',
        'Order cancellation reports whether the customer notification succeeded.',
      ] },
      { title: 'Orders', icon: 'bi-receipt', bullets: [
        'Clover-only refunds have explicit safeguards.',
        'Order deletion requires payment verification.',
        'Order numbers can be changed safely with Clover synchronization.',
      ] },
    ],
  },
  {
    date: '2026-09-07', summary: 'Appointment fixes.', sources: ['f209d5b'],
    categories: [{ title: 'Appointments', icon: 'bi-calendar-check', bullets: [
      'Appointment handling fixes improve the booking workflow.',
    ] }],
  },
  {
    date: '2026-08-23', summary: 'Refunds, email retries, and deletion fixes.', sources: ['d66ae59'],
    categories: [{ title: 'Orders', icon: 'bi-receipt', bullets: [
      'Clover refunds, email retries, and order deletion receive reliability fixes.',
    ] }],
  },
  {
    date: '2026-08-22', summary: 'Order editing and refund workflows.', sources: ['dd9f041', '5e72dde'],
    categories: [{ title: 'Orders', icon: 'bi-receipt', bullets: [
      'Order editing and Clover refund workflows include safety checks.',
      'Orders can be permanently deleted through a dedicated control.',
    ] }],
  },
  {
    date: '2026-08-21', summary: 'Consistent size controls and protected uploads.', sources: ['b625d58', '6a7506a', '0af6474', '07b7281', 'd397499'],
    categories: [{ title: 'Items', icon: 'bi-bag', bullets: [
      'Dedicated sizes replace primary sizes when selected, with explicit skirt, jacket, and shirt labels.',
      'Size selection is consolidated and uploads have additional safeguards.',
    ] }],
  },
  {
    date: '2026-08-20', summary: 'Generic size labels.', sources: ['b14a128'],
    categories: [{ title: 'Items', icon: 'bi-bag', bullets: ['Generic size labels are used consistently.'] }],
  },
  {
    date: '2026-08-18', summary: 'Clover payments.', sources: ['e86ef28'],
    categories: [{ title: 'Payments', icon: 'bi-credit-card', bullets: ['Payment handling moves to Clover.'] }],
  },
  {
    date: '2026-08-06', summary: 'Media processing and photo cropping fixes.', sources: ['f03053a', '9ac4cce', '79ccf4a'],
    categories: [
      { title: 'Items', icon: 'bi-bag', bullets: ['Missing XL sizes are restored.'] },
      { title: 'Media', icon: 'bi-images', bullets: [
        'Media processing feedback and page loading are improved.',
        'Photo cropping and video uploading receive fixes.',
      ] },
    ],
  },
  {
    date: '2026-08-04', summary: 'Item saving, restocking, and app launches.', sources: ['ce98b3d', '3d6c6b9', 'e8b8169', '53fca59', '6afe972', '9a85487'],
    categories: [
      { title: 'App navigation', icon: 'bi-phone', bullets: ['Installed app launches stay on the dashboard.'] },
      { title: 'Items', icon: 'bi-bag', bullets: [
        'Dashboard item saving receives fixes.',
        'Item deletion is available from the editor and recent items.',
        'Restocking and sweatshirt sizes are improved, and legacy sizes follow item type.',
      ] },
    ],
  },
  {
    date: '2026-07-21', summary: 'Background notifications and alert preferences.', sources: ['d066dae', '48d45c1'],
    categories: [{ title: 'Notifications', icon: 'bi-bell', bullets: [
      'Alert type toggles receive improvements.',
      'Background push notifications receive reliability fixes.',
    ] }],
  },
  {
    date: '2026-07-19', summary: 'App updates, alerts, and footer appearance.', sources: ['d383066', 'b5bf8a5', '05b6f0a', '1fcdc4d', 'a6fe9bb', 'a0952f9'],
    categories: [
      { title: 'App updates', icon: 'bi-arrow-repeat', bullets: [
        'Saved update controls, badge behavior, and configurable update alerts are improved.',
      ] },
      { title: 'Appearance', icon: 'bi-palette', bullets: [
        'Dashboard typography, glass footer appearance, and touch interactions are refined.',
      ] },
      { title: 'Notifications', icon: 'bi-bell', bullets: [
        'Order and booking notifications can be customized.',
      ] },
    ],
  },
  {
    date: '2026-07-17', summary: 'Push notifications, access security, and iPhone safe areas.', sources: ['d233492', '011cf2f', '13cf64d', 'cd3e98c', '7374712'],
    categories: [
      { title: 'Appearance', icon: 'bi-palette', bullets: [
        'Dashboard headers respect the iPhone status area, with an app-only transparent status setting.',
      ] },
      { title: 'Notifications', icon: 'bi-bell', bullets: ['Web push notifications are available in the installed app.'] },
      { title: 'Security', icon: 'bi-shield-check', bullets: ['Dashboard APIs are protected with Cloudflare Access.'] },
    ],
  },
  {
    date: '2026-07-14', summary: 'Local drafts, photo editing, and mobile navigation.', sources: ['294c6bb', 'b484376', '5c19143', '028ff42', 'c928db1', 'efc37f6'],
    categories: [
      { title: 'Appearance', icon: 'bi-palette', bullets: ['Glass effects and footer depth are adjustable.'] },
      { title: 'Drafts', icon: 'bi-file-earmark', bullets: ['Item drafts save locally and have a dedicated dashboard page.'] },
      { title: 'Media', icon: 'bi-images', bullets: ['Photo cropping has expanded controls, contained handles, and reachable actions.'] },
      { title: 'Navigation', icon: 'bi-phone', bullets: [
        'Item save actions remain visible on mobile.',
        'Recent dashboard tiles navigate to their corresponding pages.',
      ] },
    ],
  },
  {
    date: '2026-07-13', summary: 'Complete item editing and collection controls.', sources: ['73b73ad', 'f119ebe', '5f7c446', '12ba7dc', 'f7c4783', '5af5842', '09e513e'],
    categories: [
      { title: 'Collections', icon: 'bi-collection', bullets: [
        'Collection renaming opens in an overlay.',
        'Filters/Sub-Collections are optional when creating or editing items.',
      ] },
      { title: 'Items', icon: 'bi-bag', bullets: [
        'Item editing restores all fields and fixes duplicate sizes and editor loading.',
        'Shoe sizes use dropdowns with whole sizes from six through twelve.',
      ] },
      { title: 'Navigation', icon: 'bi-phone', bullets: ['Dashboard navigation supports taps and drag selection with a liquid glass appearance.'] },
    ],
  },
  {
    date: '2026-07-12', summary: 'Managed video and style-specific item details.', sources: ['37cb897', '303ae24', '980b413', 'd44a7f1', 'e2a3481'],
    categories: [{ title: 'Items', icon: 'bi-bag', bullets: [
      'Bling pricing and storefront product fields synchronize with dashboard edits.',
      'Managed video uploads are available in the dashboard.',
      'Style is a built-in property with style-specific descriptions.',
    ] }],
  },
  {
    date: '2026-07-10', summary: 'Inventory, collection management, and mobile editing.', sources: ['442cc29', '62206ea', '136e533', 'f7e0e0e', '8ba0327', 'd156f60', 'b9273ac', '3ed1a0f'],
    categories: [
      { title: 'Collections', icon: 'bi-collection', bullets: ['Collection deletion uses two in-app confirmations with accessible management controls.'] },
      { title: 'Items', icon: 'bi-bag', bullets: [
        'Dropdown options are alphabetized, and shirt size and color templates are available.',
        'Inventory quantities can be managed in the dashboard.',
        'Item editing matches creation and only asks to discard when changes are unsaved.',
      ] },
      { title: 'Navigation', icon: 'bi-phone', bullets: ['Mobile layouts keep editing actions and drag-select navigation reachable.'] },
    ],
  },
]

export const formatReleaseDate = (date) => date === 'TBD' ? 'TBD' : new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T12:00:00Z`))
