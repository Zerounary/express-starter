import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

export const useUserStore = defineStore(
  'user-store',
  () => {
    const token = ref('')
    const username = ref('')
    const realName = ref('')
    const role = ref(0)
    const companyId = ref(0)

    const isLoggedIn = computed(() => !!token.value)
    const isAdmin = computed(() => role.value === 1)

    async function login(form) {
      const res = await apiLogin(form)
      const d = res.data
      token.value = d.token || d.accessToken
      username.value = d.username
      realName.value = d.real_name
      role.value = d.role
      companyId.value = d.company_id
      return d
    }

    async function logout() {
      try {
        await apiLogout()
      } catch {}
      $reset()
    }

    function $reset() {
      token.value = ''
      username.value = ''
      realName.value = ''
      role.value = 0
      companyId.value = 0
    }

    return { token, username, realName, role, companyId, isLoggedIn, isAdmin, login, logout, $reset }
  },
  { persist: true },
)
