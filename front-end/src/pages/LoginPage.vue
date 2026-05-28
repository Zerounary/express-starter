<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const router = useRouter()
const user = useUserStore()

const form = reactive({ username: 'admin', password: 'root123' })
const loading = ref(false)

async function onSubmit() {
  if (!form.username || !form.password) return ElMessage.warning('请填写用户名和密码')
  loading.value = true
  try {
    await user.login(form)
    ElMessage.success('登录成功')
    router.replace('/')
  } catch (err) {
    ElMessage.error(err.message || '登录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (user.isLoggedIn) router.replace('/')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eef2ff] via-[#f0fdf4] to-[#ecfeff] p-4">
    <!-- Floating shapes -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-200/20 blur-3xl" />
      <div class="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full bg-emerald-200/15 blur-3xl" />
    </div>

    <div class="relative w-full max-w-400px">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 text-white text-xl font-bold shadow-lg shadow-brand-500/25 mb-4">Q</div>
        <h1 class="text-2xl font-bold text-gray-800">QuickDist</h1>
        <p class="text-sm text-gray-400 mt-1">快开系统</p>
      </div>

      <!-- Card -->
      <div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/60 p-8">
        <h2 class="text-lg font-semibold text-gray-700 mb-6">欢迎登录</h2>

        <div>
          <div class="mb-4">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              prefix-icon="User"
              class="login-input"
              size="large"
            />
          </div>
          <div class="mb-4">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="密码"
              prefix-icon="Lock"
              class="login-input"
              size="large"
              @keyup.enter="onSubmit"
            />
          </div>
          <el-button
            type="primary"
            :loading="loading"
            class="w-full !h-11 !rounded-xl !text-base btn-gradient !shadow-lg !shadow-brand-500/20"
            @click="onSubmit"
          >
            登 录
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.login-input .el-input__wrapper) {
  border-radius: 12px;
  padding: 4px 12px;
  box-shadow: 0 0 0 1px #e5e7eb inset;
  transition: all 0.3s;
}
:deep(.login-input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c7d2fe inset;
}
:deep(.login-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #6366f1 inset;
}
</style>
