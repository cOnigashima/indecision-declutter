import { createRouter, createWebHistory } from 'vue-router';
import WorkbenchPage from './pages/WorkbenchPage.vue';
import CapturePage from './pages/CapturePage.vue';
import DetailsPage from './pages/DetailsPage.vue';

const routes = [
    { path: '/', redirect: '/items' },
    { path: '/items', component: WorkbenchPage },
    { path: '/items/:id', component: DetailsPage },
    { path: '/capture', component: CapturePage },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
