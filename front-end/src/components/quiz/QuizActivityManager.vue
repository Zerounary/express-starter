<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import {
  createQuizActivity,
  deleteQuizActivity,
  getQuizActivity,
  getQuizActivityStats,
  listQuizActivities,
  listQuizBanks,
  updateQuizActivity,
} from '../../api/quiz'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const statsVisible = ref(false)
const statsActiveTab = ref('overview')
const rows = ref([])
const banks = ref([])
const stats = ref(null)
const pagination = reactive({ page: 1, page_size: 10, total: 0 })
const query = reactive({ keyword: '', enabled: undefined })
const form = reactive({
  id: null,
  name: '',
  start_time: '',
  end_time: '',
  stage_no: 1,
  question_count: 0,
  enabled: 1,
  intro: '',
  bank_ids: [],
  style_json_text: JSON.stringify({
    backgroundImage: '',
    backgroundColor: '#0f172a',
    startButtonText: '开始答题',
    startButtonColor: '#2563eb',
    showScoreRule: true,
    showIntro: true,
    cardOpacity: 0.92,
  }, null, 2),
  score_rule_json_text: JSON.stringify({
    correct_score: 1,
    wrong_score: 0,
    timeout_score: 0,
    timeout_seconds: 200,
  }, null, 2),
})

const currentOrigin = computed(() => window.location.origin)

async function loadBanks() {
  const res = await listQuizBanks({ page: 1, page_size: 200, status: 1 })
  banks.value = res.data.rows
}

async function loadData() {
  loading.value = true
  try {
    const res = await listQuizActivities({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: query.keyword || undefined,
      enabled: query.enabled,
    })
    rows.value = res.data.rows
    pagination.total = res.data.total
  } catch (err) {
    ElMessage.error(err.message || '加载活动失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = null
  form.name = ''
  form.start_time = ''
  form.end_time = ''
  form.stage_no = 1
  form.question_count = 0
  form.enabled = 1
  form.intro = ''
  form.bank_ids = []
  form.style_json_text = JSON.stringify({
    backgroundImage: '',
    backgroundColor: '#0f172a',
    startButtonText: '开始答题',
    startButtonColor: '#2563eb',
    showScoreRule: true,
    showIntro: true,
    cardOpacity: 0.92,
  }, null, 2)
  form.score_rule_json_text = JSON.stringify({
    correct_score: 1,
    wrong_score: 0,
    timeout_score: 0,
    timeout_seconds: 200,
  }, null, 2)
}

function formatDateTime(value) {
  if (!value) return ''
  return value.replace('Z', '').slice(0, 16)
}

function toIsoString(value) {
  return value ? new Date(value).toISOString() : null
}

function handleCreate() {
  resetForm()
  dialogVisible.value = true
}

async function handleEdit(row) {
  try {
    const res = await getQuizActivity(row.id)
    const detail = res.data
    form.id = detail.id
    form.name = detail.name
    form.start_time = formatDateTime(detail.start_time)
    form.end_time = formatDateTime(detail.end_time)
    form.stage_no = Number(detail.stage_no || 1)
    form.question_count = Number(detail.question_count || 0)
    form.enabled = detail.enabled
    form.intro = detail.intro || ''
    form.bank_ids = detail.bank_ids ? [...detail.bank_ids] : []
    form.style_json_text = JSON.stringify(detail.style_json || {}, null, 2)
    form.score_rule_json_text = JSON.stringify(detail.score_rule_json || {}, null, 2)
    dialogVisible.value = true
  } catch (err) {
    ElMessage.error(err.message || '加载活动详情失败')
  }
}

function buildLink(row) {
  return `${currentOrigin.value}/unauth/quiz?token=${encodeURIComponent(row.access_token)}#${row.name}`
}

async function handleCopy(row) {
  try {
    await navigator.clipboard.writeText(buildLink(row))
    ElMessage.success('答题链接已复制')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

async function handleSave() {
  if (!form.name.trim()) return ElMessage.warning('请输入活动名称')
  if (!form.start_time || !form.end_time) return ElMessage.warning('请选择活动时间')
  if (!form.bank_ids.length) return ElMessage.warning('请至少选择一个题库')

  let style_json
  let score_rule_json
  try {
    style_json = JSON.parse(form.style_json_text || '{}')
    score_rule_json = JSON.parse(form.score_rule_json_text || '{}')
  } catch {
    return ElMessage.warning('样式 JSON 或积分规则 JSON 格式不正确')
  }

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      start_time: toIsoString(form.start_time),
      end_time: toIsoString(form.end_time),
      stage_no: Number(form.stage_no || 1),
      question_count: Number(form.question_count || 0),
      enabled: form.enabled,
      intro: form.intro || null,
      bank_ids: form.bank_ids,
      style_json,
      score_rule_json,
    }
    if (form.id) {
      await updateQuizActivity(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createQuizActivity(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (err) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除活动“${row.name}”吗？`, '提示', { type: 'warning' })
    await deleteQuizActivity(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.message || '删除失败')
  }
}

async function handleStats(row) {
  try {
    const res = await getQuizActivityStats(row.id)
    stats.value = res.data
    statsActiveTab.value = 'overview'
    statsVisible.value = true
  } catch (err) {
    ElMessage.error(err.message || '加载统计失败')
  }
}

function formatParticipantStatus(status) {
  return status === 2 ? '已完成' : status === 1 ? '进行中' : '未开始'
}

function participantStatusType(status) {
  return status === 2 ? 'success' : status === 1 ? 'warning' : 'info'
}

function formatAccuracy(row) {
  if (!row || !row.answered_count) return '0%'
  return `${((Number(row.correct_count || 0) / Number(row.answered_count || 1)) * 100).toFixed(0)}%`
}

function formatParticipation(row) {
  if (!row || !row.participant_id) return '未参与'
  const answered = Number(row.answered_count || 0)
  if (answered <= 0) return '已参与未作答'
  const score = Number(row.total_score || 0)
  return score === 0 ? '答题未得分' : '已答题'
}

function exportStudentRankings() {
  if (!stats.value?.student_rankings?.length) return ElMessage.warning('暂无可导出数据')
  const rows = stats.value.student_rankings.map((row, idx) => ({
    排名: idx + 1,
    学号: row.student_no,
    学校: row.school_name || '',
    年级: row.grade_name || '',
    班级: row.class_name || '',
    参与情况: formatParticipation(row),
    积分: Number(row.total_score || 0),
    已答题数: Number(row.answered_count || 0),
    答对题数: Number(row.correct_count || 0),
    总题数: Number(row.total_questions || 0),
    总耗时ms: Number(row.total_elapsed_ms || 0),
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, '个人排名')
  XLSX.writeFile(wb, `${stats.value.activity?.name || '活动'}-个人排名.xlsx`)
}

function exportClassRankings() {
  if (!stats.value?.class_rankings?.length) return ElMessage.warning('暂无可导出数据')
  const rows = stats.value.class_rankings.map((row, idx) => ({
    排名: idx + 1,
    学校: row.school_name || '',
    年级: row.grade_name || '',
    班级: row.class_name || '',
    班级总积分: Number(row.total_score || 0),
    总人数: Number(row.total_students || 0),
    参与人数: Number(row.participated_students || 0),
    完成人数: Number(row.completed_students || 0),
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, '班级排名')
  XLSX.writeFile(wb, `${stats.value.activity?.name || '活动'}-班级排名.xlsx`)
}

function exportGradeRankings() {
  if (!stats.value?.grade_rankings?.length) return ElMessage.warning('暂无可导出数据')
  const rows = stats.value.grade_rankings.map((row, idx) => ({
    排名: idx + 1,
    学校: row.school_name || '',
    年级: row.grade_name || '',
    年级总积分: Number(row.total_score || 0),
    总人数: Number(row.total_students || 0),
    参与人数: Number(row.participated_students || 0),
    完成人数: Number(row.completed_students || 0),
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, '年级排名')
  XLSX.writeFile(wb, `${stats.value.activity?.name || '活动'}-年级排名.xlsx`)
}

onMounted(async () => {
  try {
    await loadBanks()
    await loadData()
  } catch (err) {
    ElMessage.error(err.message || '初始化失败')
  }
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="text-base font-semibold">活动配置</div>
        <div class="flex items-center gap-3 flex-wrap">
          <el-select v-model="query.enabled" placeholder="状态" clearable class="w-120px">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="停用" />
          </el-select>
          <el-input v-model="query.keyword" placeholder="搜索活动名称" clearable class="w-220px" @keyup.enter="loadData" />
          <el-button @click="loadData">查询</el-button>
          <el-button type="primary" @click="handleCreate">新增活动</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="name" label="活动名称" min-width="180" />
      <el-table-column prop="stage_no" label="期次" width="90" />
      <el-table-column label="活动时间" min-width="260">
        <template #default="{ row }">{{ row.start_time }} ~ {{ row.end_time }}</template>
      </el-table-column>
      <el-table-column prop="bank_count" label="题库数" width="90" />
      <el-table-column prop="question_count" label="题目数" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.enabled === 1 ? 'success' : 'info'">{{ row.enabled === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="320" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link @click="handleCopy(row)">复制答题链接</el-button>
          <el-button link @click="handleStats(row)">统计</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        layout="total, sizes, prev, pager, next"
        :total="pagination.total"
        @current-change="loadData"
        @size-change="loadData"
      />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑活动' : '新增活动'" width="920px" destroy-on-close>
    <el-form label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12"><el-form-item label="活动名称"><el-input v-model="form.name" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="启用状态"><el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" /></el-form-item></el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12"><el-form-item label="开始时间"><el-input v-model="form.start_time" type="datetime-local" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="结束时间"><el-input v-model="form.end_time" type="datetime-local" /></el-form-item></el-col>
      </el-row>
      <el-form-item label="期次">
        <el-input-number v-model="form.stage_no" :min="1" :max="999" />
      </el-form-item>
      <el-form-item label="题目数">
        <el-input-number v-model="form.question_count" :min="0" :max="500" />
        <div class="text-xs text-gray-500 ml-2">0 表示不限制（按题库题目数随机抽取）</div>
      </el-form-item>
      <el-form-item label="活动简介"><el-input v-model="form.intro" type="textarea" :rows="3" /></el-form-item>
      <el-form-item label="所用题库">
        <el-select v-model="form.bank_ids" multiple collapse-tags class="w-full">
          <el-option v-for="bank in banks" :key="bank.id" :label="bank.name" :value="bank.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="界面样式 JSON"><el-input v-model="form.style_json_text" type="textarea" :rows="8" /></el-form-item>
      <el-form-item label="积分规则 JSON"><el-input v-model="form.score_rule_json_text" type="textarea" :rows="6" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="statsVisible" title="活动统计" size="900px">
    <template v-if="stats">
      <el-tabs v-model="statsActiveTab">
        <el-tab-pane label="统计概览" name="overview">
          <div class="grid grid-cols-3 gap-4 mb-6">
            <el-card shadow="never"><div class="text-sm text-gray-500">参与人数</div><div class="text-2xl font-semibold mt-2">{{ stats.total_participants }}</div></el-card>
            <el-card shadow="never"><div class="text-sm text-gray-500">完成人数</div><div class="text-2xl font-semibold mt-2">{{ stats.completed_count }}</div></el-card>
            <el-card shadow="never"><div class="text-sm text-gray-500">平均分</div><div class="text-2xl font-semibold mt-2">{{ Number(stats.average_score || 0).toFixed(2) }}</div></el-card>
          </div>
          <el-card shadow="never" class="mb-4">
            <div class="font-semibold mb-2">活动信息</div>
            <div class="text-sm text-gray-600 leading-7">名称：{{ stats.activity.name }}</div>
            <div class="text-sm text-gray-600 leading-7">题库：{{ stats.activity.bank_names?.join('、') || '-' }}</div>
            <div class="text-sm text-gray-600 leading-7">简介：{{ stats.activity.intro || '-' }}</div>
          </el-card>
          <el-table :data="stats.leaderboard" border>
            <el-table-column type="index" label="排名" width="70" />
            <el-table-column prop="student_no" label="学号" min-width="160" />
            <el-table-column prop="total_score" label="积分" width="100" />
            <el-table-column prop="total_elapsed_ms" label="总耗时(ms)" width="130" />
            <el-table-column prop="finished_at" label="完成时间" min-width="180" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="个人排行列表" name="participants">
          <el-table :data="stats.participant_rankings || []" border>
            <el-table-column type="index" label="排名" width="70" />
            <el-table-column prop="student_no" label="学号" min-width="140" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="participantStatusType(row.status)">{{ formatParticipantStatus(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="total_score" label="积分" width="90" />
            <el-table-column prop="answered_count" label="已答题数" width="100" />
            <el-table-column prop="correct_count" label="答对题数" width="100" />
            <el-table-column label="正确率" width="100">
              <template #default="{ row }">{{ formatAccuracy(row) }}</template>
            </el-table-column>
            <el-table-column prop="total_questions" label="总题数" width="90" />
            <el-table-column prop="total_elapsed_ms" label="总耗时(ms)" width="130" />
            <el-table-column prop="finished_at" label="完成时间" min-width="180" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="个人排名(含未参与)" name="student_rank">
          <div class="flex justify-end mb-3">
            <el-button @click="exportStudentRankings">Excel 导出</el-button>
          </div>
          <el-table :data="stats.student_rankings || []" border>
            <el-table-column type="index" label="排名" width="70" />
            <el-table-column prop="student_no" label="学号" min-width="140" />
            <el-table-column prop="school_name" label="学校" min-width="160" show-overflow-tooltip />
            <el-table-column prop="grade_name" label="年级" min-width="120" show-overflow-tooltip />
            <el-table-column prop="class_name" label="班级" min-width="140" show-overflow-tooltip />
            <el-table-column label="参与情况" width="120">
              <template #default="{ row }">{{ formatParticipation(row) }}</template>
            </el-table-column>
            <el-table-column prop="total_score" label="积分" width="90" />
            <el-table-column prop="answered_count" label="已答题数" width="100" />
            <el-table-column prop="correct_count" label="答对题数" width="100" />
            <el-table-column prop="total_questions" label="总题数" width="90" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="班级积分排行" name="class_rank">
          <div class="flex justify-end mb-3">
            <el-button @click="exportClassRankings">Excel 导出</el-button>
          </div>
          <el-table :data="stats.class_rankings || []" border>
            <el-table-column type="index" label="排名" width="70" />
            <el-table-column prop="school_name" label="学校" min-width="160" show-overflow-tooltip />
            <el-table-column prop="grade_name" label="年级" min-width="120" show-overflow-tooltip />
            <el-table-column prop="class_name" label="班级" min-width="140" show-overflow-tooltip />
            <el-table-column prop="total_score" label="总积分" width="110" />
            <el-table-column prop="total_students" label="总人数" width="90" />
            <el-table-column prop="participated_students" label="参与人数" width="90" />
            <el-table-column prop="completed_students" label="完成人数" width="90" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="年级积分排行" name="grade_rank">
          <div class="flex justify-end mb-3">
            <el-button @click="exportGradeRankings">Excel 导出</el-button>
          </div>
          <el-table :data="stats.grade_rankings || []" border>
            <el-table-column type="index" label="排名" width="70" />
            <el-table-column prop="school_name" label="学校" min-width="160" show-overflow-tooltip />
            <el-table-column prop="grade_name" label="年级" min-width="140" show-overflow-tooltip />
            <el-table-column prop="total_score" label="总积分" width="110" />
            <el-table-column prop="total_students" label="总人数" width="90" />
            <el-table-column prop="participated_students" label="参与人数" width="90" />
            <el-table-column prop="completed_students" label="完成人数" width="90" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
  </el-drawer>
</template>
