import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { sitePages } from '../data/siteData'

const CollectionsView = () => import('../views/CollectionsView.vue')
const CollectionView = () => import('../views/CollectionView.vue')
const StaticPageView = () => import('../views/StaticPageView.vue')
const NotFoundView = () => import('../../404View.vue')
const OrderSuccessView = () => import('../views/OrderSuccessView.vue')
const OrderFailureView = () => import('../views/OrderFailureView.vue')
const OrderCancelledView = () => import('../views/OrderCancelledView.vue')
const BookingDepositView = () => import('../views/BookingDepositView.vue')
const BookingPaymentSuccessView = () => import('../views/BookingPaymentSuccessView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const DashboardHome = () => import('../components/dashboard/DashboardHome.vue')
const DashboardDrafts = () => import('../components/dashboard/DashboardDrafts.vue')
const DashboardItems = () => import('../components/dashboard/DashboardItems.vue')
const DashboardOrders = () => import('../components/dashboard/DashboardOrders.vue')
const DashboardSettings = () => import('../components/dashboard/DashboardSettings.vue')
const DashboardItemCreation = () => import('../components/dashboard/DashboardItemCreation.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    alias: ['/index.html'],
  },
  {
    path: '/collections',
    name: 'Collections',
    component: CollectionsView,
    alias: ['/collections.html'],
  },

  ...sitePages.map((page) => ({
    path: page.path,
    name: `page-${page.slug}`,
    component: StaticPageView,
    props: { slug: page.slug },
    alias: [`/${page.slug}.html`],
  })),

  {
    path: '/collections/:slug',
    name: 'collection',
    component: CollectionView,
    props: true,
  },

  {
    path: '/dashboard',
    component: DashboardView,
    meta: {
      dashboard: true,
      hideLayout: true,
    },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: DashboardHome,
      },
      {
        path: 'items',
        name: 'DashboardItems',
        component: DashboardItems,
      },
      {
        path: 'drafts',
        name: 'DashboardDrafts',
        component: DashboardDrafts,
      },
      {
        path: 'orders',
        name: 'DashboardOrders',
        component: DashboardOrders,
      },
      {
        path: 'settings',
        name: 'DashboardSettings',
        component: DashboardSettings,
      },
      {
        path: 'create',
        name: 'DashboardItemCreation',
        component: DashboardItemCreation,
      },
    ],
  },

  {
    path: '/order-success',
    name: 'OrderSuccess',
    component: OrderSuccessView,
  },

  {
    path: '/order-failure',
    name: 'OrderFailure',
    component: OrderFailureView,
  },

  {
    path: '/order-cancelled',
    name: 'OrderCancelled',
    component: OrderCancelledView,
  },

  {
    path: '/booking/:service(fitting|brides)',
    name: 'BookingDeposit',
    component: BookingDepositView,
    props: true,
  },

  {
    path: '/booking-payment-success',
    name: 'BookingPaymentSuccess',
    component: BookingPaymentSuccessView,
  },

  {
    path: '/404.html',
    name: 'NotFound',
    component: NotFoundView,
    meta: { hideLayout: true },
  },

  {
    path: '/:catchAll(.*)',
    name: 'CatchAll',
    component: NotFoundView,
    meta: { hideLayout: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,

  scrollBehavior(to) {
    // Product cards are loaded asynchronously by CollectionView, so that view
    // scrolls to product anchors once the requested item exists in the DOM.
    if (to.hash.startsWith('#product-')) return false

    if (to.hash) {
      return {
        el: to.hash,
        top: 0,
        left: 0,
        behavior: 'instant',
      }
    }

    if (to.meta.scrollTarget) {
      return {
        el: to.meta.scrollTarget,
        top: to.meta.scrollOffset || 0,
        left: 0,
        behavior: 'instant',
      }
    }

    return {
      top: 0,
      left: 0,
      behavior: 'instant',
    }
  },
})

export default router
