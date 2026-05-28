<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import QuizActivityManager from '../components/quiz/QuizActivityManager.vue'
import QuizActivityStats from '../components/quiz/QuizActivityStats.vue'
import QuizBankManager from '../components/quiz/QuizBankManager.vue'
import QuizQuestionManager from '../components/quiz/QuizQuestionManager.vue'
import StudentNoManager from '../components/studentNo/StudentNoManager.vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const user = useUserStore()
const activeMenu = ref('dashboard')
const sidebarCollapsed = ref(false)

const pageTitle = computed(() => {
  const map = {
    dashboard: '后台工作台',
    banks: '题库管理',
    questions: '题目管理',
    activities: '活动管理',
    stats: '活动统计',
    studentNos: '学号管理',
  }
  return map[activeMenu.value] || '后台工作台'
})

const pageDescription = computed(() => {
  const map = {
    dashboard: '统一查看题库、题目、活动与排行榜统计，按左侧菜单切换业务模块。',
    banks: '维护题库基础信息，支持启停、说明管理与题目数量查看。',
    questions: '维护题目、按题库筛选，并支持 Excel 模板下载和批量导入。',
    activities: '配置答题活动、复制公开链接，并维护活动基本信息。',
    stats: '按活动查看统计概览、个人/班级/年级排行，并支持 Excel 导出。',
    studentNos: '维护可用学号、班级与年级信息，支持 Excel 模板下载与批量导入。',
  }
  return map[activeMenu.value] || ''
})

onMounted(() => {
  if (!user.isLoggedIn) {
    router.replace('/login')
  }
})

async function handleLogout() {
  try {
    await user.logout()
    router.replace('/login')
  } catch (err) {
    console.error('退出登录失败:', err)
    // 即使 API 调用失败，也清除本地状态并跳转
    user.$reset()
    router.replace('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
    <div class="flex min-h-screen">
      <aside
        class="relative shrink-0 border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-900/90 text-white transition-all duration-500 ease-out backdrop-blur-xl shadow-2xl shadow-slate-900/20"
        :class="sidebarCollapsed ? 'w-20' : 'w-72'"
      >
        <div class="border-b border-white/10" :class="sidebarCollapsed ? 'px-4 py-5' : 'px-8 py-7'">
          <div class="font-bold tracking-wide" :class="sidebarCollapsed ? 'text-center text-xl' : 'text-2xl'">
            {{ sidebarCollapsed ? 'QD' : 'QuickDist' }}
          </div>
          <div v-if="!sidebarCollapsed" class="mt-2 text-sm text-white/60 font-light tracking-wide">答题系统管理后台</div>
        </div>

        <div :class="sidebarCollapsed ? 'px-3 py-4' : 'px-6 py-5'">
          <div class="rounded-2xl bg-white/10 backdrop-blur-md px-5 py-4 border border-white/10 shadow-lg">
            <div class="font-medium text-white/90" :class="sidebarCollapsed ? 'text-center text-sm' : 'text-sm'">
              {{ sidebarCollapsed ? user.realName?.[0] || 'U' : user.realName }}
            </div>
            <div v-if="!sidebarCollapsed" class="mt-1 text-xs text-white/50">{{ user.username }}</div>
          </div>
        </div>

        <nav :class="sidebarCollapsed ? 'px-3 pb-6' : 'px-4 pb-6'">
          <el-menu
            :default-active="activeMenu"
            :collapse="sidebarCollapsed"
            :collapse-transition="true"
            class="!border-none !bg-transparent"
            text-color="rgba(255, 255, 255, 0.7)"
            active-text-color="#ffffff"
            background-color="transparent"
          >
            <el-menu-item index="dashboard" @click="activeMenu = 'dashboard'">
              <el-icon><Monitor /></el-icon>
              <template #title>工作台</template>
            </el-menu-item>
            <el-menu-item index="banks" @click="activeMenu = 'banks'">
              <el-icon><FolderOpened /></el-icon>
              <template #title>题库管理</template>
            </el-menu-item>
            <el-menu-item index="questions" @click="activeMenu = 'questions'">
              <el-icon><Document /></el-icon>
              <template #title>题目管理</template>
            </el-menu-item>
            <el-menu-item index="activities" @click="activeMenu = 'activities'">
              <el-icon><DataAnalysis /></el-icon>
              <template #title>活动管理</template>
            </el-menu-item>
            <el-menu-item index="stats" @click="activeMenu = 'stats'">
              <el-icon><TrendCharts /></el-icon>
              <template #title>活动统计</template>
            </el-menu-item>
            <el-menu-item index="studentNos" @click="activeMenu = 'studentNos'">
              <el-icon><UserFilled /></el-icon>
              <template #title>学号管理</template>
            </el-menu-item>
          </el-menu>
        </nav>

        <div class="absolute bottom-6 left-0 right-0" :class="sidebarCollapsed ? 'px-3' : 'px-4'">
          <button
            type="button"
            class="flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm bg-transparent text-white/60 hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-105"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <el-icon class="text-xl transition-transform hover:rotate-180">
              <component :is="sidebarCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
          </button>
        </div>
      </aside>

      <main class="min-w-0 flex-1">
        <div class="border-b border-white/10 bg-white/80 backdrop-blur-xl px-8 py-6 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{{ pageTitle }}</h1>
              <p class="mt-2 text-sm text-slate-500 leading-relaxed">{{ pageDescription }}</p>
            </div>
            <button
              type="button"
              @click="handleLogout"
              class="rounded-2xl border border-slate-200/50 bg-white/50 px-6 py-2.5 text-sm font-medium text-slate-600 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300"
            >
              退出登录
            </button>
          </div>
        </div>

        <div class="p-8">
          <template v-if="activeMenu === 'dashboard'">
            <div class="grid gap-6 md:grid-cols-3">
              <div class="group rounded-3xl bg-white/60 backdrop-blur-xl p-6 border border-white/50 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-100/50">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110">
                  <el-icon class="text-2xl"><component :is="'FolderOpened'" /></el-icon>
                </div>
                <div class="text-lg font-semibold text-slate-800">题库管理</div>
                <div class="mt-3 text-sm leading-6 text-slate-500">支持题库启停、描述维护与题目数量查看，适合统一管理不同学段题目。</div>
              </div>
              <div class="group rounded-3xl bg-white/60 backdrop-blur-xl p-6 border border-white/50 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-100/50">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-110">
                  <el-icon class="text-2xl"><component :is="'Document'" /></el-icon>
                </div>
                <div class="text-lg font-semibold text-slate-800">题目管理</div>
                <div class="mt-3 text-sm leading-6 text-slate-500">支持单选、填空、问答题维护，并可通过 Excel 模板批量导入。</div>
              </div>
              <div class="group rounded-3xl bg-white/60 backdrop-blur-xl p-6 border border-white/50 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-100/50">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/30 transition-transform group-hover:scale-110">
                  <el-icon class="text-2xl"><component :is="'DataAnalysis'" /></el-icon>
                </div>
                <div class="text-lg font-semibold text-slate-800">活动统计</div>
                <div class="mt-3 text-sm leading-6 text-slate-500">支持活动配置、公开链接分发、排行榜查看和个人排行报表统计。</div>
              </div>
            </div>

            <div class="mt-8 rounded-3xl bg-white/60 backdrop-blur-xl p-8 border border-white/50 shadow-xl shadow-slate-200/50">
              <div class="grid gap-5 md:grid-cols-4 text-sm text-slate-600">
                <div class="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 border border-slate-200/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/30">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-md shadow-blue-500/20">
                      <el-icon class="text-sm"><component :is="'Grid'" /></el-icon>
                    </div>
                    <div class="font-semibold text-slate-800">标准后台布局</div>
                  </div>
                  <div class="leading-relaxed text-slate-500">左侧菜单切换模块，右侧展示对应 CRUD 和统计内容。</div>
                </div>
                <div class="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 border border-slate-200/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/30">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-500 text-white shadow-md shadow-indigo-500/20">
                      <el-icon class="text-sm"><component :is="'TrendCharts'" /></el-icon>
                    </div>
                    <div class="font-semibold text-slate-800">活动报表</div>
                  </div>
                  <div class="leading-relaxed text-slate-500">查看活动汇总指标、排行榜，以及个人排行明细。</div>
                </div>
                <div class="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 border border-slate-200/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/30">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-md shadow-purple-500/20">
                      <el-icon class="text-sm"><component :is="'Link'" /></el-icon>
                    </div>
                    <div class="font-semibold text-slate-800">公开答题页</div>
                  </div>
                  <div class="leading-relaxed text-slate-500">通过活动链接直接访问，使用 token 进行公开页面授权。</div>
                </div>
                <div class="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 border border-slate-200/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/30">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md shadow-emerald-500/20">
                      <el-icon class="text-sm"><component :is="'Lightbulb'" /></el-icon>
                    </div>
                    <div class="font-semibold text-slate-800">使用建议</div>
                  </div>
                  <div class="leading-relaxed text-slate-500">先建题库，再导入题目，最后配置活动并查看活动完成效果。</div>
                </div>
              </div>
            </div>
          </template>

          <QuizBankManager v-else-if="activeMenu === 'banks'" />
          <QuizQuestionManager v-else-if="activeMenu === 'questions'" />
          <QuizActivityManager v-else-if="activeMenu === 'activities'" />
          <QuizActivityStats v-else-if="activeMenu === 'stats'" />
          <StudentNoManager v-else />
        </div>
      </main>
    </div>
  </div>
</template>
