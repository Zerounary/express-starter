<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { getQuizActivityStats, listQuizActivities } from '../../api/quiz'

const loadingActivities = ref(false)
const activities = ref([])
const selectedActivityId = ref(null)

const selectedSchoolName = ref('')

const loadingStats = ref(false)
const statsActiveTab = ref('overview')
const stats = ref(null)

const activityOptions = computed(() => activities.value || [])
const schoolOptions = computed(() => stats.value?.school_options || [])

async function loadActivities() {
  loadingActivities.value = true
  try {
    const res = await listQuizActivities({ page: 1, page_size: 200 })
    activities.value = res.data.rows || []
    if (!selectedActivityId.value && activities.value.length) {
      selectedActivityId.value = activities.value[0].id
    }
  } catch (err) {
    ElMessage.error(err.message || '加载活动列表失败')
  } finally {
    loadingActivities.value = false
  }
}

async function loadStats(activityId, resetTab = true) {
  if (!activityId) {
    stats.value = null
    return
  }
  loadingStats.value = true
  try {
    const params = {}
    if (selectedSchoolName.value) params.school_name = selectedSchoolName.value
    const res = await getQuizActivityStats(activityId, params)
    stats.value = res.data
    if (resetTab) statsActiveTab.value = 'overview'
  } catch (err) {
    ElMessage.error(err.message || '加载统计失败')
  } finally {
    loadingStats.value = false
  }
}

async function handleRefresh() {
  if (!selectedActivityId.value) return
  await loadStats(selectedActivityId.value, false)
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

let suppressSchoolWatch = false

watch(selectedActivityId, async (val) => {
  suppressSchoolWatch = true
  selectedSchoolName.value = ''
  await loadStats(val)
  suppressSchoolWatch = false
})

watch(selectedSchoolName, (val) => {
  if (suppressSchoolWatch) return
  if (!selectedActivityId.value) return
  loadStats(selectedActivityId.value, false)
})

onMounted(async () => {
  await loadActivities()
  if (selectedActivityId.value) await loadStats(selectedActivityId.value)
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="text-base font-semibold">活动统计</div>
        <div class="flex items-center gap-3 flex-wrap">
          <el-select
            v-model="selectedActivityId"
            filterable
            class="w-360px"
            placeholder="选择活动"
            :loading="loadingActivities"
          >
            <el-option v-for="row in activityOptions" :key="row.id" :label="row.name" :value="row.id" />
          </el-select>

          <el-select
            v-model="selectedSchoolName"
            clearable
            filterable
            class="w-240px"
            placeholder="筛选学校(全部)"
            :disabled="!stats"
          >
            <el-option v-for="row in schoolOptions" :key="row" :label="row" :value="row" />
          </el-select>
        </div>
      </div>
    </template>

    <div v-loading="loadingStats">
      <template v-if="stats">
        <el-tabs v-model="statsActiveTab">
          <el-tab-pane label="统计概览" name="overview">
            <div class="flex justify-end mb-3">
              <el-button :loading="loadingStats" @click="handleRefresh">刷新</el-button>
            </div>
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
            <div class="flex justify-end mb-3">
              <el-button :loading="loadingStats" @click="handleRefresh">刷新</el-button>
            </div>
            <el-table :data="stats.participant_rankings || []" border>
              <el-table-column type="index" label="排名" width="70" />
              <el-table-column prop="student_no" label="学号" min-width="140" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 2 ? 'success' : row.status === 1 ? 'warning' : 'info'">
                    {{ row.status === 2 ? '已完成' : row.status === 1 ? '进行中' : '未开始' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="total_score" label="积分" width="100" />
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
            <div class="flex justify-end mb-3 gap-2">
              <el-button :loading="loadingStats" @click="handleRefresh">刷新</el-button>
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
            <div class="flex justify-end mb-3 gap-2">
              <el-button :loading="loadingStats" @click="handleRefresh">刷新</el-button>
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
            <div class="flex justify-end mb-3 gap-2">
              <el-button :loading="loadingStats" @click="handleRefresh">刷新</el-button>
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

      <el-empty v-else description="请选择活动查看统计" />
    </div>
  </el-card>
</template>
