<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPublicQuizClient } from '../../api/publicQuiz'

const route = useRoute()
const router = useRouter()
const token = computed(() => String(route.query.token || '').trim())
const state = reactive({
  activity: null,
  participantId: 0,
  studentNo: '',
  className: '',
  gradeName: '',
  status: 0,
  currentIndex: 0,
  totalQuestions: 0,
  questions: [],
  attempts: [],
  result: null,
  started: false,
})
const loading = ref(false)
const loginLoading = ref(false)
const submitLoading = ref(false)
const studentNoInput = ref('')
const answerInput = ref('')
const selectedChoice = ref('')
const hintVisible = ref(false)
const countdown = ref(30)
const timer = ref(null)
const questionStartedAt = ref(0)
const rewardVisible = ref(false)
const rewardAmount = ref(0)
const rewardLabel = ref('')
const rewardTone = ref('neutral')
const rewardTimer = ref(null)

const client = computed(() => (token.value ? createPublicQuizClient(token.value) : null))
const storageKey = computed(() => `quickdist-quiz:${token.value}`)

const styleConfig = computed(() => state.activity?.style_json || {})
const ruleConfig = computed(() => state.activity?.score_rule_json || {})
const timeoutSeconds = computed(() => Number(ruleConfig.value.timeout_seconds || 30))
const currentQuestion = computed(() => state.questions[state.currentIndex] || null)
const answeredMap = computed(() => new Map(state.attempts.map((item) => [item.sequence_no, item])))
const hasLoggedIn = computed(() => !!state.participantId && !!state.studentNo)
const isCompleted = computed(() => state.status === 2)
const answeredCount = computed(() => state.attempts.length)
const correctCount = computed(() => state.attempts.filter((item) => Number(item.is_correct) === 1).length)
const totalScore = computed(() => {
  if (state.result?.total_score !== undefined && state.result?.total_score !== null) return state.result.total_score
  return state.attempts.reduce((sum, item) => sum + Number(item.score || 0), 0)
})
const progressPercent = computed(() => {
  if (!state.totalQuestions) return 0
  return Math.min(100, Math.round((answeredCount.value / state.totalQuestions) * 100))
})
const timerPercent = computed(() => {
  if (!timeoutSeconds.value) return 0
  return Math.max(0, Math.min(100, Math.round((countdown.value / timeoutSeconds.value) * 100)))
})
const levelLabel = computed(() => `Lv.${Math.max(1, correctCount.value + 1)}`)
const stageLabel = computed(() => {
  const stageNo = Number(state.activity?.stage_no || 1)
  return `第 ${stageNo > 0 ? stageNo : 1} 期`
})
const staminaCurrent = computed(() => {
  if (!state.totalQuestions) return 5
  return Math.max(1, 5 - Math.floor((answeredCount.value / state.totalQuestions) * 4))
})
const starCount = computed(() => {
  if (!state.totalQuestions) return 1
  const ratio = correctCount.value / state.totalQuestions
  if (ratio >= 0.9) return 3
  if (ratio >= 0.6) return 2
  return 1
})
const questionTypeLabel = computed(() => {
  if (!currentQuestion.value) return '闯关挑战'
  return currentQuestion.value.question_type === 1 ? '单选挑战' : '问答挑战'
})
const profileLabel = computed(() => {
  const parts = [state.gradeName, state.className].filter((v) => String(v || '').trim())
  if (parts.length) return parts.join(' · ')
  return gradeLabel.value
})
const gradeLabel = computed(() => {
  if (!state.totalQuestions) return '未登录'
  // 返回用户的年级
  return state.gradeName
})
const mascotMessage = computed(() => {
  if (!hasLoggedIn.value) return '先输入学号，和晓乐一起开始闯关吧。'
  if (isCompleted.value) return '太棒啦，你已经完成今天的闯关挑战。'
  if (!state.started) return '看清规则再出发，每一关都能拿到小红花。'
  if (currentQuestion.value?.question_type === 1) return '先找关键词，再选出最合适的答案。'
  return '想一想学过的知识，把最重要的话写出来。'
})
const hintText = computed(() => {
  if (!currentQuestion.value) return '准备好以后，点开始按钮进入下一关。'
  if (currentQuestion.value.question_type === 1) return '小提示：先读题目里的关键字，再把明显不对的选项排除掉。'
  return '小提示：先写关键词，再把答案连成一句完整的话。'
})
const primaryActionDisabled = computed(() => {
  if (submitLoading.value || !currentQuestion.value) return true
  if (currentQuestion.value.question_type === 1) return !selectedChoice.value
  return !answerInput.value.trim()
})
const primaryActionText = computed(() => {
  if (submitLoading.value) return '正在结算'
  if (answeredCount.value + 1 >= state.totalQuestions) return '提交并结算'
  return '提交答案'
})
const statusSummary = computed(() => {
  if (isCompleted.value) return '闯关完成，等待荣耀结算'
  if (!hasLoggedIn.value) return '请先登录后开启本局闯关'
  if (!state.started) return '准备就绪，点击按钮开启答题闯关'
  return selectedChoice.value || answerInput.value.trim() ? '答案已就绪，立即提交赢取奖励' : '选择答案后即可提交，超时将自动结算'
})

function clearRewardTimer() {
  if (rewardTimer.value) {
    clearTimeout(rewardTimer.value)
    rewardTimer.value = null
  }
}

function showRewardPopup(score, isCorrect, isTimeout) {
  clearRewardTimer()
  rewardAmount.value = Number(score || 0)
  if (isCorrect) {
    rewardLabel.value = '答对加分'
    rewardTone.value = 'success'
  } else if (isTimeout) {
    rewardLabel.value = rewardAmount.value === 0 ? '闯关超时' : '超时扣分'
    rewardTone.value = 'timeout'
  } else {
    rewardLabel.value = '回答错误'
    rewardTone.value = 'danger'
  }
  rewardVisible.value = true
  rewardTimer.value = setTimeout(() => {
    rewardVisible.value = false
    rewardTimer.value = null
  }, 1500)
}

function selectOption(label) {
  if (submitLoading.value) return
  selectedChoice.value = label
}

function toggleHint() {
  if (!currentQuestion.value && state.started) return
  hintVisible.value = !hintVisible.value
}

async function handlePrimaryAction() {
  if (!currentQuestion.value) return
  if (currentQuestion.value.question_type === 1) {
    if (!selectedChoice.value) return ElMessage.warning('请选择一个答案')
    await submitAnswer(selectedChoice.value)
    return
  }
  if (!answerInput.value.trim()) return ElMessage.warning('请输入答案后再提交')
  await submitAnswer(answerInput.value.trim())
}

async function handleNextStage() {
  if (!state.started || !currentQuestion.value) {
    if (!hasLoggedIn.value) return ElMessage.warning('先登录再开始闯关哦')
    startQuiz()
    return
  }
  await handlePrimaryAction()
}

function handleReturnHome() {
  clearTimer()
  clearRewardTimer()
  rewardVisible.value = false
  hintVisible.value = false
  selectedChoice.value = ''
  answerInput.value = ''
  if (!hasLoggedIn.value) {
    router.replace({ path: '/unauth/quiz', query: { token: token.value } })
    return
  }
  state.started = false
}

function saveLocalState(extra = {}) {
  if (!token.value) return
  localStorage.setItem(
    storageKey.value,
    JSON.stringify({
      studentNo: state.studentNo,
      className: state.className,
      gradeName: state.gradeName,
      participantId: state.participantId,
      currentIndex: state.currentIndex,
      questionStartedAt: questionStartedAt.value,
      started: state.started,
      ...extra,
    }),
  )
}

function loadLocalState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey.value) || '{}')
  } catch {
    return {}
  }
}

function clearTimer() {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

function restartTimer() {
  clearTimer()
  if (!currentQuestion.value || isCompleted.value || !state.started) return
  const local = loadLocalState()
  const fallbackStart = Date.now()
  questionStartedAt.value = Number(local.questionStartedAt || fallbackStart)
  const remain = Math.max(0, timeoutSeconds.value - Math.floor((Date.now() - questionStartedAt.value) / 1000))
  countdown.value = remain
  if (remain <= 0) {
    handleTimeout()
    return
  }
  timer.value = setInterval(() => {
    const left = Math.max(0, timeoutSeconds.value - Math.floor((Date.now() - questionStartedAt.value) / 1000))
    countdown.value = left
    if (left <= 0) handleTimeout()
  }, 300)
  saveLocalState()
}

async function loadActivity() {
  if (!client.value) {
    ElMessage.error('缺少活动 token')
    return
  }
  loading.value = true
  try {
    const res = await client.value.getActivity()
    state.activity = res.data
  } catch (err) {
    ElMessage.error(err.message || '加载活动失败')
  } finally {
    loading.value = false
  }
}

async function doLogin(studentNo) {
  loginLoading.value = true
  try {
    const res = await client.value.login({ student_no: studentNo })
    const data = res.data
    state.activity = data.activity
    state.participantId = data.participant_id
    state.studentNo = data.student_no
    state.className = data.class_name || ''
    state.gradeName = data.grade_name || ''
    state.status = data.status
    state.currentIndex = data.current_index
    state.totalQuestions = data.total_questions
    state.questions = data.questions || []
    state.attempts = data.attempts || []
    state.started = loadLocalState().started || data.current_index > 0 || data.status === 2
    saveLocalState()
    if (data.status === 2) {
      await loadResult()
    } else if (state.started) {
      restartTimer()
    }
  } catch (err) {
    ElMessage.error(err.message || '登录失败')
  } finally {
    loginLoading.value = false
  }
}

async function handleLogin() {
  if (!studentNoInput.value.trim()) return ElMessage.warning('请输入学号')
  if (!client.value) return ElMessage.error('缺少活动 token')
  const sn = studentNoInput.value.trim()
  try {
    loginLoading.value = true
    await client.value.checkStudentNo({ student_no: sn })
    loginLoading.value = false

    await ElMessageBox.confirm(`请确认学号“${sn}”输入正确。`, '确认学号', { type: 'warning' })
    await doLogin(sn)
  } catch (err) {
    loginLoading.value = false
    if (err !== 'cancel') ElMessage.error(err.message || '登录失败')
  }
}

async function tryAutoLogin() {
  const local = loadLocalState()
  if (local.studentNo) {
    studentNoInput.value = local.studentNo
    state.className = local.className || ''
    state.gradeName = local.gradeName || ''
    await doLogin(local.studentNo)
  }
}

function startQuiz() {
  state.started = true
  hintVisible.value = false
  selectedChoice.value = ''
  answerInput.value = ''
  questionStartedAt.value = Date.now()
  countdown.value = timeoutSeconds.value
  saveLocalState({ questionStartedAt: questionStartedAt.value, started: true })
  restartTimer()
}

async function afterSubmit(data, meta = {}) {
  state.currentIndex = data.current_index
  state.status = data.finished ? 2 : 1
  state.attempts = [...state.attempts, {
    participant_id: data.participant_id,
    sequence_no: data.sequence_no,
    is_correct: data.is_correct ? 1 : 0,
    is_timeout: meta.isTimeout ? 1 : 0,
    score: data.score,
    elapsed_ms: Math.max(0, Date.now() - questionStartedAt.value),
  }]
  showRewardPopup(data.score, data.is_correct, meta.isTimeout)
  if (data.finished) {
    clearTimer()
    hintVisible.value = false
    saveLocalState({ questionStartedAt: 0, started: true })
    await loadResult()
    return
  }
  answerInput.value = ''
  selectedChoice.value = ''
  hintVisible.value = false
  questionStartedAt.value = Date.now()
  countdown.value = timeoutSeconds.value
  saveLocalState({ questionStartedAt: questionStartedAt.value, started: true })
  restartTimer()
}

async function submitAnswer(answer, isTimeout = false) {
  if (!currentQuestion.value || submitLoading.value) return
  submitLoading.value = true
  clearTimer()
  try {
    const elapsed = Math.max(0, Date.now() - questionStartedAt.value)
    const res = await client.value.submitProgress({
      participant_id: state.participantId,
      sequence_no: currentQuestion.value.sequence_no,
      answer,
      elapsed_ms: elapsed,
      is_timeout: isTimeout,
    })
    await afterSubmit(res.data, { isTimeout })
  } catch (err) {
    ElMessage.error(err.message || '提交失败')
    restartTimer()
  } finally {
    submitLoading.value = false
  }
}

async function handleTimeout() {
  clearTimer()
  await submitAnswer('', true)
}

async function loadResult() {
  try {
    const res = await client.value.getResult(state.participantId)
    state.result = res.data
    saveLocalState({ questionStartedAt: 0, started: true })
  } catch (err) {
    ElMessage.error(err.message || '获取结果失败')
  }
}

watch(currentQuestion, () => {
  answerInput.value = ''
  selectedChoice.value = ''
  hintVisible.value = false
  if (state.started && !isCompleted.value) restartTimer()
})

onMounted(async () => {
  await loadActivity()
  await tryAutoLogin()
})

onBeforeUnmount(() => {
  clearTimer()
  clearRewardTimer()
  saveLocalState()
})
</script>

<template>
  <div
    class="kid-quiz-page min-h-screen"
    :style="{
      background: styleConfig.backgroundImage
        ? `linear-gradient(180deg, rgba(247,248,255,.68), rgba(255,255,255,.72)), url(${styleConfig.backgroundImage}) center/cover no-repeat`
        : styleConfig.backgroundColor || 'linear-gradient(180deg, #a7dfff 0%, #d9f6ff 24%, #fff7c7 48%, #ffd7ea 74%, #d7ffd9 100%)',
    }"
  >
    <div class="kid-overlay min-h-screen px-3 py-4">
      <div class="floating-decorations" aria-hidden="true">
        <span class="float-item float-item--1">🎈</span>
        <span class="float-item float-item--2">✨</span>
        <span class="float-item float-item--3">🌈</span>
        <span class="float-item float-item--4">🎁</span>
        <span class="float-item float-item--5">☁️</span>
        <span class="float-item float-item--6">🏆</span>
        <span class="float-item float-item--7">🍬</span>
        <span class="float-item float-item--8">🎀</span>
        <span class="float-item float-item--9">🌸</span>
        <span class="float-item float-item--10">🎇</span>
      </div>

      <div v-if="rewardVisible && rewardTone === 'success'" class="celebrate-layer celebrate-layer--firework" aria-hidden="true">
        <span>🎇</span><span>✨</span><span>🎆</span><span>🌟</span><span>🎇</span>
      </div>
      <div v-if="rewardVisible && rewardTone !== 'success'" class="celebrate-layer celebrate-layer--oops" aria-hidden="true">
        <span>😜</span><span>💭</span><span>😵</span>
      </div>
      <div v-if="isCompleted && state.result" class="celebrate-layer celebrate-layer--balloon" aria-hidden="true">
        <span>🎈</span><span>🎈</span><span>✨</span><span>🌟</span><span>🎈</span><span>🌈</span>
      </div>

      <div class="kid-shell mx-auto w-full max-w-430px">
        <div class="kid-topbar jelly-card">
          <div class="kid-topbar__row">
            <div class="player-card">
              <div class="player-avatar">🐰</div>
              <div>
                <div class="player-name">{{ state.studentNo || '科普小达人' }}</div>
                <div class="player-grade">{{ profileLabel }}</div>
              </div>
            </div>
            <div class="star-badges">
              <span v-for="star in 3" :key="`top-${star}`" class="star-badge" :class="{ 'star-badge--active': star <= starCount }">⭐</span>
            </div>
          </div>

          <div class="resource-grid">
            <div class="resource-card resource-card--yellow">
              <div class="resource-card__label">积分💰</div>
              <div class="resource-card__value">{{ totalScore }}</div>
            </div>
            <div class="resource-card resource-card--pink">
              <div class="resource-card__label">期次👑</div>
              <div class="resource-card__value">{{ stageLabel }}</div>
            </div>
          </div>

          <div class="progress-board">
            <div class="progress-board__label">闯关进度 📊</div>
            <div class="progress-board__track">
              <div class="progress-board__fill" :style="{ width: `${progressPercent}%` }"></div>
            </div>
            <div class="progress-board__text">{{ answeredCount }}/{{ state.totalQuestions || 0 }}</div>
          </div>
        </div>

        <div class="mascot-bubble jelly-card">
          <div class="mascot-bubble__icon">💬</div>
          <div>
            <div class="mascot-bubble__title">晓乐助教</div>
            <div class="mascot-bubble__text">{{ mascotMessage }}</div>
          </div>
        </div>

        <div class="main-playground jelly-card">
          <div v-if="loading" class="state-panel">
            <div class="state-panel__emoji">🌈</div>
            <div class="state-panel__title">正在准备游戏</div>
            <div class="state-panel__text">请等一等，题目马上就出来啦。</div>
          </div>

          <template v-else-if="!token">
            <div class="state-panel">
              <div class="state-panel__emoji">🧩</div>
              <div class="state-panel__title">找不到游戏门票</div>
              <div class="state-panel__text">这个链接少了活动口令，暂时不能开始闯关。</div>
            </div>
          </template>

          <template v-else-if="!hasLoggedIn">
            <div class="welcome-panel">
              <div class="welcome-panel__title">{{ state.activity?.name || '快乐闯关' }}</div>
              <div class="welcome-panel__desc">输入学号后，开启科普闯关吧！</div>

              <div v-if="styleConfig.showIntro !== false && state.activity?.intro" class="story-card">
                {{ state.activity.intro }}
              </div>

              <div class="welcome-stats">
                <div class="mini-card mini-card--blue"><span>答对加分</span><strong>+{{ ruleConfig.correct_score ?? 10 }} 分</strong></div>
                <div class="mini-card mini-card--yellow"><span>答错扣分</span><strong>{{ Number(ruleConfig.wrong_score ?? -2) === 0 ? '不扣分' : (ruleConfig.wrong_score ?? -2) }}</strong></div>
                <div class="mini-card mini-card--green"><span>每题时间</span><strong>{{ timeoutSeconds }} 秒</strong></div>
              </div>

              <div class="login-box">
                <div class="login-box__title">👤 输入学号</div>
                <el-input v-model="studentNoInput" size="large" placeholder="请输入学号" class="kid-input" />
                <button class="fun-btn fun-btn--pink" :disabled="loginLoading" @click="handleLogin">
                  {{ loginLoading ? '正在进入乐园...' : '开始登录' }}
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="isCompleted && state.result">
            <div class="result-board">
              <div class="result-board__title">闯关成功 🎉</div>
              <div class="result-board__desc">你今天表现超棒，快来看看自己的成绩吧。</div>
              <div class="result-board__stars">
                <span v-for="star in 3" :key="`result-star-${star}`" class="result-star" :class="{ 'result-star--active': star <= starCount }">⭐</span>
              </div>
              <div class="result-metrics">
                <div class="result-box result-box--pink"><span>积分</span><strong>{{ state.result.total_score }}</strong></div>
                <div class="result-box result-box--blue"><span>排名</span><strong>第 {{ state.result.rank }} 名</strong></div>
                <div class="result-box result-box--yellow"><span>耗时</span><strong>{{ (Number(state.result.total_elapsed_ms || 0) / 1000).toFixed(2) }}秒</strong></div>
                <div class="result-box result-box--green"><span>完成人数</span><strong>{{ state.result.completed_count }}</strong></div>
              </div>
            </div>
          </template>

          <template v-else-if="!state.started">
            <div class="start-board">
              <div class="start-board__title">准备开始啦 🚀</div>
              <div class="start-board__desc">本次闯关活动，一共 {{ state.activity.question_count }} 关，全部为单选题。</div>
              <!-- <div class="story-card">{{ hintText }}</div> -->
              <div v-if="styleConfig.showScoreRule !== false" class="rule-cards">
                <div class="mini-card mini-card--pink"><span>答对</span><strong>+{{ ruleConfig.correct_score ?? 10 }}分</strong></div>
                <div class="mini-card mini-card--blue"><span>答错</span><strong>{{ Number(ruleConfig.wrong_score ?? -2) === 0 ? '不扣分' : (ruleConfig.wrong_score ?? -2) }}</strong></div>
                <div class="mini-card mini-card--green"><span>超时</span><strong>{{ Number(ruleConfig.timeout_score ?? -5) === 0 ? '不扣分' : (ruleConfig.timeout_score ?? -5) }}</strong></div>
                <div class="mini-card mini-card--yellow"><span>时间</span><strong>{{ timeoutSeconds }} 秒</strong></div>
              </div>
              <button class="mt-3 fun-btn fun-btn--rainbow" @click="startQuiz">{{ styleConfig.startButtonText || '开始闯关' }}</button>
            </div>
          </template>

          <template v-else-if="currentQuestion">
            <div class="quiz-board">
              <div class="quiz-head">
                <div>
                  <div class="quiz-head__tag">{{ questionTypeLabel }}</div>
                  <div class="quiz-head__title">第 {{ currentQuestion.sequence_no }} / {{ state.totalQuestions }} 题</div>
                </div>
                <div class="timer-cloud">
                  <div class="timer-cloud__value">{{ countdown }}</div>
                  <div class="timer-cloud__label">秒</div>
                </div>
              </div>

              <div class="timer-strip">
                <div class="timer-strip__fill" :style="{ width: `${timerPercent}%` }"></div>
              </div>

              <div class="question-bubble">
                <div class="question-bubble__title">📖 {{ currentQuestion.title }}</div>
                <div class="question-bubble__text">把题目读两遍，再选择或写出你觉得最好的答案。</div>
              </div>

              <transition name="hint-pop">
                <div v-if="hintVisible" class="hint-card">💡 {{ hintText }}</div>
              </transition>

              <div v-if="currentQuestion.question_type === 1" class="option-grid">
                <button
                  v-for="option in currentQuestion.options || []"
                  :key="option.label"
                  class="quiz-option"
                  :class="{
                    'quiz-option--selected': selectedChoice === option.label,
                    'quiz-option--soft': answeredMap.has(currentQuestion.sequence_no),
                  }"
                  @click="selectOption(option.label)"
                >
                  <span class="quiz-option__badge">{{ option.label }}</span>
                  <span class="quiz-option__text">{{ option.content }}</span>
                </button>
              </div>

              <div v-else class="answer-box">
                <el-input
                  v-model="answerInput"
                  type="textarea"
                  :rows="6"
                  placeholder="把你的答案写在这里吧"
                  class="kid-input kid-input--textarea"
                />
              </div>

              <button class="mt-3 fun-btn fun-btn--green" :disabled="primaryActionDisabled" @click="handlePrimaryAction">提交 ✅</button>
            </div>
          </template>
        </div>

        <transition name="reward-pop">
          <div v-if="rewardVisible" class="reward-badge" :class="`reward-badge--${rewardTone}`">
            <div class="reward-badge__label">{{ rewardLabel }}</div>
            <div v-if="rewardTone === 'success' || rewardAmount !== 0" class="reward-badge__value">{{ rewardAmount > 0 ? `+${rewardAmount}` : rewardAmount }}</div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kid-quiz-page {
  position: relative;
  overflow: hidden;
  color: #4f5075;
}

.kid-quiz-page::before,
.kid-quiz-page::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.kid-quiz-page::before {
  background:
    radial-gradient(circle at 12% 12%, rgba(255, 255, 255, 0.7), transparent 18%),
    radial-gradient(circle at 88% 10%, rgba(255, 215, 241, 0.45), transparent 22%),
    radial-gradient(circle at 50% 100%, rgba(255, 253, 232, 0.76), transparent 35%);
}

.kid-overlay {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.1));
}

.floating-decorations,
.celebrate-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.float-item,
.celebrate-layer span {
  position: absolute;
  animation: bobUp 6s ease-in-out infinite;
  filter: drop-shadow(0 8px 12px rgba(255, 255, 255, 0.35));
}

.float-item--1 { top: 5%; left: 5%; font-size: 34px; animation-delay: 0s; }
.float-item--2 { top: 12%; right: 8%; font-size: 28px; animation-delay: .8s; }
.float-item--3 { top: 18%; left: 65%; font-size: 36px; animation-delay: 1.2s; }
.float-item--4 { top: 30%; right: 12%; font-size: 30px; animation-delay: 1.6s; }
.float-item--5 { top: 42%; left: 6%; font-size: 30px; animation-delay: 2s; }
.float-item--6 { top: 55%; right: 5%; font-size: 28px; animation-delay: 2.4s; }
.float-item--7 { top: 68%; left: 10%; font-size: 30px; animation-delay: 2.8s; }
.float-item--8 { top: 74%; right: 18%; font-size: 28px; animation-delay: 3.2s; }
.float-item--9 { top: 84%; left: 70%; font-size: 26px; animation-delay: 3.6s; }
.float-item--10 { top: 88%; left: 22%; font-size: 26px; animation-delay: 4s; }

.celebrate-layer--firework span:nth-child(1) { top: 16%; left: 12%; font-size: 40px; }
.celebrate-layer--firework span:nth-child(2) { top: 10%; left: 42%; font-size: 34px; }
.celebrate-layer--firework span:nth-child(3) { top: 18%; right: 14%; font-size: 42px; }
.celebrate-layer--firework span:nth-child(4) { top: 28%; left: 62%; font-size: 30px; }
.celebrate-layer--firework span:nth-child(5) { top: 24%; left: 26%; font-size: 36px; }

.celebrate-layer--oops span:nth-child(1) { top: 18%; left: 32%; font-size: 44px; animation: wobbleFace .9s ease-in-out infinite; }
.celebrate-layer--oops span:nth-child(2) { top: 12%; left: 55%; font-size: 26px; }
.celebrate-layer--oops span:nth-child(3) { top: 22%; left: 64%; font-size: 36px; animation: wobbleFace .9s ease-in-out infinite .1s; }

.celebrate-layer--balloon span:nth-child(1) { bottom: 10%; left: 6%; font-size: 38px; animation: balloonRise 4.6s linear infinite; }
.celebrate-layer--balloon span:nth-child(2) { bottom: 4%; left: 26%; font-size: 34px; animation: balloonRise 5.2s linear infinite .4s; }
.celebrate-layer--balloon span:nth-child(3) { bottom: 22%; left: 44%; font-size: 26px; animation: sparkleJump 1.4s ease-in-out infinite; }
.celebrate-layer--balloon span:nth-child(4) { bottom: 30%; right: 24%; font-size: 26px; animation: sparkleJump 1.1s ease-in-out infinite .2s; }
.celebrate-layer--balloon span:nth-child(5) { bottom: 8%; right: 10%; font-size: 38px; animation: balloonRise 4.8s linear infinite .9s; }
.celebrate-layer--balloon span:nth-child(6) { bottom: 18%; left: 68%; font-size: 32px; animation: sparkleJump 1.6s ease-in-out infinite .3s; }

.kid-shell {
  position: relative;
  z-index: 1;
}

.jelly-card {
  position: relative;
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.72);
  border: 2px solid rgba(255, 255, 255, 0.82);
  box-shadow:
    0 18px 32px rgba(116, 170, 210, 0.22),
    0 8px 0 rgba(200, 229, 255, 0.92),
    inset 0 2px 0 rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
}

.kid-topbar,
.main-playground,
.mascot-bubble {
  padding: 16px;
}

.kid-topbar__row,
.player-card,
.progress-board,
.mascot-bubble,
.quiz-head {
  display: flex;
  align-items: center;
}

.kid-topbar__row,
.progress-board,
.quiz-head {
  justify-content: space-between;
  gap: 12px;
}

.player-card {
  gap: 12px;
}

.player-avatar,
.timer-cloud {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #fff4c7, #ffd4f0);
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.8), 0 10px 18px rgba(255, 186, 220, 0.38);
}

.player-avatar {
  font-size: 30px;
}

.player-name,
.quiz-head__title,
.welcome-panel__title,
.start-board__title,
.result-board__title,
.state-panel__title {
  font-size: 24px;
  font-weight: 900;
  color: #59608c;
}

.player-grade,
.progress-board__label,
.progress-board__text,
.mascot-bubble__text,
.welcome-panel__desc,
.state-panel__text,
.question-bubble__text,
.result-board__desc,
.story-card {
  color: #6f76a5;
}

.star-badges {
  display: flex;
  gap: 6px;
}

.star-badge {
  font-size: 24px;
  opacity: 0.35;
  transform: scale(0.96);
}

.star-badge--active,
.result-star--active {
  opacity: 1;
  transform: scale(1.08);
}

.resource-grid,
.welcome-stats,
.rule-cards,
.result-metrics,
.footer-actions {
  display: grid;
  gap: 12px;
}

.resource-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 14px;
}

.resource-card,
.mini-card,
.result-box {
  border-radius: 24px;
  padding: 12px;
  text-align: center;
  box-shadow: 0 10px 18px rgba(140, 183, 216, 0.18), inset 0 2px 0 rgba(255, 255, 255, 0.8);
}

.resource-card--blue,
.mini-card--blue,
.result-box--blue { background: linear-gradient(180deg, #d8f3ff, #bfe7ff); }
.resource-card--yellow,
.mini-card--yellow,
.result-box--yellow { background: linear-gradient(180deg, #fff7bf, #ffe7a1); }
.resource-card--pink,
.mini-card--pink,
.result-box--pink { background: linear-gradient(180deg, #ffd8ef, #ffc4e5); }
.mini-card--green,
.result-box--green { background: linear-gradient(180deg, #d6ffd8, #baf0c5); }

.resource-card__label,
.mini-card span,
.result-box span {
  display: block;
  font-size: 12px;
  color: #6d7297;
}

.resource-card__value,
.mini-card strong,
.result-box strong {
  display: block;
  margin-top: 6px;
  font-size: 18px;
  font-weight: 900;
  color: #4f577c;
}

.progress-board {
  margin-top: 14px;
}

.progress-board__track,
.timer-strip {
  flex: 1;
  height: 16px;
  border-radius: 999px;
  overflow: hidden;
  background: #eef7ff;
  box-shadow: inset 0 2px 4px rgba(145, 189, 220, 0.18);
}

.progress-board__fill,
.timer-strip__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8cd4ff, #ffbeea 45%, #ffe98c 100%);
}

.mascot-bubble {
  gap: 12px;
  margin-top: 14px;
}

.mascot-bubble__icon {
  width: 46px;
  height: 46px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #c6eeff, #f6d1ff);
  font-size: 22px;
}

.mascot-bubble__title,
.welcome-panel__badge,
.quiz-head__tag,
.login-box__title {
  font-size: 13px;
  font-weight: 800;
  color: #6570a5;
}

.main-playground {
  margin-top: 16px;
  min-height: 70vh;
}

.state-panel,
.welcome-panel,
.result-board,
.start-board,
.quiz-board {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.state-panel {
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 56px 18px;
}

.state-panel__emoji {
  font-size: 52px;
}

.state-panel__text,
.welcome-panel__desc,
.result-board__desc,
.start-board__desc {
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.7;
}

.welcome-panel__badge,
.welcome-panel__title,
.welcome-panel__desc,
.result-board,
.start-board {
  text-align: center;
}

.story-card,
.login-box,
.question-bubble,
.hint-card,
.answer-box {
  margin-top: 16px;
  padding: 16px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 12px 22px rgba(163, 204, 236, 0.18), inset 0 2px 0 rgba(255, 255, 255, 0.82);
}

.story-card {
  line-height: 1.8;
}

.welcome-stats,
.rule-cards,
.result-metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 16px;
}

.login-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fun-btn {
  width: 100%;
  border: none;
  border-radius: 24px;
  padding: 15px 14px;
  font-size: 18px;
  font-weight: 900;
  color: #4f5a7b;
  cursor: pointer;
  box-shadow: 0 12px 18px rgba(148, 189, 222, 0.22), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 -4px 0 rgba(220, 226, 255, 0.82);
  transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
}

.fun-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.fun-btn:active:not(:disabled) {
  transform: translateY(2px);
}

.fun-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.fun-btn--pink { background: linear-gradient(180deg, #ffd9ef, #ffc6e6); }
.fun-btn--blue { background: linear-gradient(180deg, #d9f1ff, #bfe6ff); }
.fun-btn--green { background: linear-gradient(180deg, #ddffdf, #bff1c8); }
.fun-btn--yellow { background: linear-gradient(180deg, #fff8c7, #ffe799); }
.fun-btn--rainbow { background: linear-gradient(90deg, #ffd8ee, #d8f6ff 35%, #fff2b2 70%, #d9ffd9); }

.result-board__stars {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

.result-star {
  font-size: 28px;
  opacity: .35;
}

.quiz-head__tag {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, #d8efff, #ffe2f2);
}

.quiz-head__title {
  margin-top: 8px;
  font-size: 22px;
}

.timer-cloud {
  color: #5b6396;
  font-weight: 900;
  background: linear-gradient(180deg, #ffffff, #d9f4ff);
}

.timer-cloud__value {
  font-size: 24px;
  line-height: 1;
}

.timer-cloud__label {
  font-size: 11px;
  margin-top: 2px;
}

.timer-strip {
  margin-top: 14px;
}

.question-bubble__title {
  font-size: 24px;
  font-weight: 900;
  line-height: 1.7;
  color: #59618d;
}

.question-bubble__text {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.7;
}

.hint-card {
  background: linear-gradient(180deg, #fffdf0, #fff2b5);
  color: #6d678a;
  font-weight: 700;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.quiz-option {
  min-height: 122px;
  border: none;
  border-radius: 28px;
  padding: 14px;
  text-align: left;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 22px rgba(154, 194, 228, 0.2), inset 0 2px 0 rgba(255, 255, 255, 0.92);
  color: #5a628f;
  transition: transform .16s ease, box-shadow .16s ease, background .16s ease;
}

.quiz-option:active {
  transform: translateY(2px);
}

.quiz-option--selected {
  background: linear-gradient(180deg, #fff1f9, #dff6ff);
  box-shadow: 0 16px 26px rgba(155, 205, 238, 0.24), 0 0 0 3px rgba(255, 214, 235, 0.65);
  transform: scale(0.9);
}

.quiz-option__badge {
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 900;
  background: linear-gradient(180deg, #fff7c9, #ffdca2);
}

.quiz-option__text {
  display: block;
  margin-top: 12px;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.6;
}

.answer-box {
  margin-top: 16px;
}

.footer-actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 18px;
}

.reward-badge {
  position: fixed;
  left: 50%;
  top: 18%;
  transform: translateX(-50%);
  z-index: 30;
  min-width: 180px;
  padding: 16px 20px;
  text-align: center;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 32px rgba(155, 199, 233, 0.26);
}

.reward-badge--success { background: linear-gradient(180deg, #fff6c7, #ffe59f); }
.reward-badge--danger,
.reward-badge--timeout { background: linear-gradient(180deg, #ffd7e8, #ffc5de); }

.reward-badge__label {
  font-size: 14px;
  font-weight: 700;
  color: #6e7098;
}

.reward-badge__value {
  margin-top: 6px;
  font-size: 34px;
  font-weight: 900;
  color: #5e648f;
}

.reward-pop-enter-active,
.reward-pop-leave-active,
.hint-pop-enter-active,
.hint-pop-leave-active {
  transition: all .26s ease;
}

.reward-pop-enter-from,
.reward-pop-leave-to,
.hint-pop-enter-from,
.hint-pop-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(.94);
}

:deep(.kid-input .el-input__wrapper),
:deep(.kid-input--textarea .el-textarea__inner) {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 18px rgba(172, 210, 238, 0.18), inset 0 2px 0 rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(216, 239, 255, 0.96);
}

:deep(.kid-input .el-input__inner),
:deep(.kid-input--textarea .el-textarea__inner) {
  color: #5c638d;
  font-size: 16px;
  font-weight: 700;
}

:deep(.kid-input .el-input__inner::placeholder),
:deep(.kid-input--textarea .el-textarea__inner::placeholder) {
  color: #b5badb;
}

@keyframes bobUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes balloonRise {
  0% { transform: translateY(0) scale(1); opacity: .2; }
  20% { opacity: 1; }
  100% { transform: translateY(-340px) scale(1.08); opacity: 0; }
}

@keyframes sparkleJump {
  0%, 100% { transform: scale(.9) rotate(0deg); }
  50% { transform: scale(1.15) rotate(10deg); }
}

@keyframes wobbleFace {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}

@media (max-width: 420px) {
  .player-name,
  .quiz-head__title,
  .welcome-panel__title,
  .start-board__title,
  .result-board__title,
  .state-panel__title,
  .question-bubble__title {
    font-size: 21px;
  }

  .resource-grid,
  .option-grid,
  .footer-actions,
  .welcome-stats,
  .rule-cards,
  .result-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
