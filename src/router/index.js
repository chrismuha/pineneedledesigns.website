import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CollectionsView from '../views/CollectionsView.vue'
import CollectionView from '../views/CollectionView.vue'
import StaticPageView from '../views/StaticPageView.vue'
import { collectionPages, sitePages } from '../data/siteData'

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
    props: true,
    alias: [`/${page.slug}.html`],
  })),
  ...sitePages.map((page) => ({
    path: page.path,
    name: `page-${page.slug}`,
    component: StaticPageView,
    props: true,
    alias: [`/${page.slug}.html`],
  })),
  { path: '/:catchAll(.*)', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
