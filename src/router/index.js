import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CollectionsView from '../views/CollectionsView.vue'
import CollectionView from '../views/CollectionView.vue'
import StaticPageView from '../views/StaticPageView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import { collectionPages, sitePages } from '../data/siteData'
import OrderSuccessView from '../views/OrderSuccessView.vue'

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
  ...collectionPages.map((page) => ({
    path: `/collections/${page.slug}`,
    name: `collection-${page.slug}`,
    component: CollectionView,
    props: { slug: page.slug },
    alias: [`/${page.slug}.html`],
    meta: { scrollTarget: '.products-header', scrollOffset: 190 },
  })),
  ...sitePages.map((page) => ({
    path: page.path,
    name: `page-${page.slug}`,
    component: StaticPageView,
    props: { slug: page.slug },
    alias: [`/${page.slug}.html`],
  })),
  {
    path: '/order-success',
    name: 'OrderSuccess',
    component: OrderSuccessView
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
    if (to.meta.scrollTarget) {
      return {
        el: to.meta.scrollTarget,
        top: to.meta.scrollOffset || 0,
        left: 0,
        behavior: 'instant',
      }
    }
    return { top: 0, left: 0, behavior: 'instant' }
  },
})

export default router
