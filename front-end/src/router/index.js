import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/LoginPage.vue'),
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('../pages/HomePage.vue'),
    },
    {
      path: '/unauth/quiz',
      name: 'UnauthQuiz',
      component: () => import('../pages/unauth/QuizPage.vue'),
    },
  ],
})

router.beforeEach((to, from) => {
  // 登录页和公开页面始终允许访问
  if (to.path === '/login' || to.path.startsWith('/unauth/')) return true

  // 如果用户未登录，重定向到登录页（不带 redirect 参数）
  const user = useUserStore()
  if (!user.isLoggedIn) {
    // 使用 replace 模式，避免添加 redirect 参数
    return { path: '/login', replace: true }
  }

  return true
})

export default router
