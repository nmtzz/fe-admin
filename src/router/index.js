import {createRouter, createWebHistory} from 'vue-router';
import DashboardLayout from '../components/DashboardLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';
import {getLoggedInUser} from "@/services/authService.js";

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
        meta: {requiresAuth: false}
    },
    {
        path: '/',
        component: DashboardLayout,
        meta: {requiresAuth: true},
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: DashboardView,
                meta: {icon: 'dashboard'}
            },
            {
                path: 'pos',
                name: 'POS',
                component: () => import('../views/vouchers/POS.vue'),
                meta: {icon: 'point_of_sale'}
            },
            {
                path: 'categories',
                name: 'Categories',
                component: () => import('../views/categories/CategoriesView.vue'),
                meta: {icon: 'category'},
                children: [
                    {
                        path: 'add',
                        name: 'Add Category',
                        component: () => import('../views/categories/AddCategoryView.vue'),
                    },
                    {
                        path: '',
                        name: 'List Categories',
                        component: () => import('../views/categories/ListCategoryView.vue'),
                    },
                    {
                        path: ':categoryId',
                        name: 'Edit Category',
                        component: () => import('../views/categories/EditCategoryView.vue'),
                    },
                ]
            },
            {
                path: 'users',
                name: 'Users',
                component: () => import('../views/users/UsersView.vue'),
                meta: {icon: 'people', requiresAdmin: true},
                children: [
                    {
                        path: '',
                        name: 'List Users',
                        component: () => import('../views/users/ListUserView.vue'),
                        meta: {requiresAdmin: true}
                    }
                ]
            },
            {
                path: 'products',
                name: 'Products',
                component: () => import('../views/products/ProductsView.vue'),
                meta: {icon: 'inventory_2'},
                children: [
                    {
                        path: '',
                        name: 'List Products',
                        component: () => import('../views/products/ListProductView.vue'),
                    },
                    {
                        path: 'add',
                        name: 'Add Product',
                        component: () => import('../views/products/AddProductView.vue'),
                    },
                    {
                        path: ':productId',
                        name: 'Edit Product',
                        component: () => import('../views/products/EditProductView.vue'),
                    },
                ]
            },
            {
                path: 'orders',
                name: 'Orders',
                component: () => import('../views/orders/OrdersView.vue'),
                meta: {icon: 'shopping_cart'},
                children: [
                    {
                        path: '',
                        name: 'List Orders',
                        component: () => import('../views/orders/ListOrderView.vue'),
                    },
                    {
                        path: ':orderId',
                        name: 'Order Detail',
                        component: () => import('../views/orders/OrderDetailView.vue'),
                    },
                ]
            },
            {
                path: 'vouchers',
                name: 'Vouchers',
                component: () => import('../views/vouchers/VouchersView.vue'),
                meta: {icon: 'local_offer'},
                children: [
                    {
                        path: '',
                        name: 'List Vouchers',
                        component: () => import('../views/vouchers/ListVoucherView.vue'),
                    },
                    {
                        path: 'add',
                        name: 'Add Voucher',
                        component: () => import('../views/vouchers/AddVoucherView.vue'),
                    },
                    {
                        path: ':voucherId',
                        name: 'Edit Voucher',
                        component: () => import('../views/vouchers/EditVoucherView.vue'),
                    },
                ]
            },
            {
                path: 'promotions',
                name: 'Promotions',
                component: () => import('../views/promotions/PromotionsView.vue'),
                meta: {icon: 'campaign', requiresAdmin: true},
                children: [
                    {
                        path: '',
                        name: 'List Promotions',
                        component: () => import('../views/promotions/ListPromotionView.vue'),
                    },
                    {
                        path: 'add',
                        name: 'Add Promotion',
                        component: () => import('../views/promotions/AddPromotionView.vue'),
                    },
                    {
                        path: ':promotionId',
                        name: 'Edit Promotion',
                        component: () => import('../views/promotions/EditPromotionView.vue'),
                    },
                ]
            },
            {
                path: 'statistics',
                name: 'Statistics',
                component: () => import('../views/statistics/StatisticsView.vue'),
                meta: {icon: 'bar_chart', requiresAdmin: true}
            },
            {
                path: 'account',
                name: 'Account',
                component: () => import('../views/AccountView.vue'),
                meta: {icon: 'account_circle'}
            },
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login'
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return {top: 0};
    }
});

router.beforeEach((to, _from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

    const isLoggedIn = localStorage.getItem('user') !== null && localStorage.getItem('token') !== null;
    const isAdmin = getLoggedInUser()?.role === 'ADMIN';
    if (requiresAdmin && !isAdmin) {
        next('/dashboard');
        return;
    }
    if (requiresAuth && !isLoggedIn) {
        next('/login');
    } else if (to.path === '/login' && isLoggedIn) {
        next('/dashboard');
    } else {
        next();
    }
});

export default router;
