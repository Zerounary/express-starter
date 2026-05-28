<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import {
  createQuizQuestion,
  deleteQuizQuestion,
  importQuizQuestions,
  listQuizBanks,
  listQuizQuestions,
  updateQuizQuestion,
} from '../../api/quiz'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const rows = ref([])
const banks = ref([])
const pagination = reactive({ page: 1, page_size: 10, total: 0 })
const query = reactive({ keyword: '', bank_id: undefined, question_type: undefined, status: undefined })
const form = reactive({
  id: null,
  bank_id: undefined,
  question_type: 1,
  title: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: '',
  analysis: '',
  sort_no: 0,
  status: 1,
})

const isSingleChoice = computed(() => form.question_type === 1)

function resetForm() {
  form.id = null
  form.bank_id = banks.value[0]?.id
  form.question_type = 1
  form.title = ''
  form.option_a = ''
  form.option_b = ''
  form.option_c = ''
  form.option_d = ''
  form.correct_answer = ''
  form.analysis = ''
  form.sort_no = 0
  form.status = 1
}

async function loadBanks() {
  const res = await listQuizBanks({ page: 1, page_size: 200, status: 1 })
  banks.value = res.data.rows
  if (!form.bank_id && banks.value.length) form.bank_id = banks.value[0].id
}

async function loadData() {
  loading.value = true
  try {
    const res = await listQuizQuestions({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: query.keyword || undefined,
      bank_id: query.bank_id,
      question_type: query.question_type,
      status: query.status,
    })
    rows.value = res.data.rows
    pagination.total = res.data.total
  } catch (err) {
    ElMessage.error(err.message || '加载题目失败')
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  form.id = row.id
  form.bank_id = row.bank_id
  form.question_type = row.question_type
  form.title = row.title
  form.option_a = row.option_a || ''
  form.option_b = row.option_b || ''
  form.option_c = row.option_c || ''
  form.option_d = row.option_d || ''
  form.correct_answer = row.correct_answer || ''
  form.analysis = row.analysis || ''
  form.sort_no = row.sort_no || 0
  form.status = row.status
  dialogVisible.value = true
}

function normalizePayload() {
  return {
    bank_id: form.bank_id,
    question_type: form.question_type,
    title: form.title.trim(),
    option_a: isSingleChoice.value ? (form.option_a || null) : null,
    option_b: isSingleChoice.value ? (form.option_b || null) : null,
    option_c: isSingleChoice.value ? (form.option_c || null) : null,
    option_d: isSingleChoice.value ? (form.option_d || null) : null,
    correct_answer: form.correct_answer.trim(),
    analysis: form.analysis || null,
    sort_no: Number(form.sort_no || 0),
    status: form.status,
  }
}

async function handleSave() {
  if (!form.bank_id) return ElMessage.warning('请选择题库')
  if (!form.title.trim()) return ElMessage.warning('请输入题目内容')
  if (!form.correct_answer.trim()) return ElMessage.warning('请输入正确答案')
  saving.value = true
  try {
    const payload = normalizePayload()
    if (form.id) {
      await updateQuizQuestion(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createQuizQuestion(payload)
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
    await ElMessageBox.confirm('确认删除该题目吗？', '提示', { type: 'warning' })
    await deleteQuizQuestion(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.message || '删除失败')
  }
}

function questionTypeLabel(type) {
  return type === 1 ? '单选题' : type === 2 ? '填空题' : '问答题'
}

function downloadTemplate() {
  const rows = [
    {
      题型: 'single',
      题目内容: '以下哪一个是正确答案示例？',
      选项A: '选项A',
      选项B: '选项B',
      选项C: '选项C',
      选项D: '选项D',
      正确答案: 'A',
      解析: '单选题正确答案填写 A/B/C/D',
      排序号: 1,
      状态: 1,
    },
    {
      题型: 'blank',
      题目内容: '请填写学校名称',
      选项A: '',
      选项B: '',
      选项C: '',
      选项D: '',
      正确答案: '某某大学',
      解析: '填空题与问答题填写标准答案文本',
      排序号: 2,
      状态: 1,
    },
  ]
  const sheet = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, '题库模板')
  XLSX.writeFile(wb, '题库导入模板.xlsx')
}

function mapQuestionType(value) {
  const text = String(value || '').trim().toLowerCase()
  if (['single', '单选', '单选题', '1'].includes(text)) return 1
  if (['blank', '填空', '填空题', '2'].includes(text)) return 2
  return 3
}

async function onImportFileChange(uploadFile) {
  if (!query.bank_id && !form.bank_id) {
    ElMessage.warning('请先选择导入目标题库')
    return false
  }
  try {
    const file = uploadFile.raw
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    if (!jsonRows.length) return ElMessage.warning('Excel 中没有可导入数据')

    const rows = jsonRows.map((item, index) => ({
      question_type: mapQuestionType(item.题型),
      title: String(item.题目内容 || '').trim(),
      option_a: item.选项A ? String(item.选项A) : null,
      option_b: item.选项B ? String(item.选项B) : null,
      option_c: item.选项C ? String(item.选项C) : null,
      option_d: item.选项D ? String(item.选项D) : null,
      correct_answer: String(item.正确答案 || '').trim(),
      analysis: item.解析 ? String(item.解析) : null,
      sort_no: Number(item.排序号 || index + 1),
      status: Number(item.状态 || 1),
    })).filter((item) => item.title)

    await importQuizQuestions({ bank_id: query.bank_id || form.bank_id, rows })
    ElMessage.success(`成功导入 ${rows.length} 道题目`)
    await loadData()
  } catch (err) {
    ElMessage.error(err.message || '导入失败')
  }
  return false
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
        <div class="text-base font-semibold">题目管理</div>
        <div class="flex items-center gap-3 flex-wrap">
          <el-select v-model="query.bank_id" placeholder="题库" clearable class="w-160px">
            <el-option v-for="bank in banks" :key="bank.id" :label="bank.name" :value="bank.id" />
          </el-select>
          <el-select v-model="query.question_type" placeholder="题型" clearable class="w-120px">
            <el-option :value="1" label="单选题" />
            <el-option :value="2" label="填空题" />
            <el-option :value="3" label="问答题" />
          </el-select>
          <el-select v-model="query.status" placeholder="状态" clearable class="w-120px">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="停用" />
          </el-select>
          <el-input v-model="query.keyword" placeholder="搜索题干" clearable class="w-220px" @keyup.enter="loadData" />
          <el-button @click="loadData">查询</el-button>
          <el-button @click="downloadTemplate">下载模板</el-button>
          <el-upload :show-file-list="false" accept=".xlsx,.xls" :auto-upload="false" :on-change="onImportFileChange">
            <el-button>Excel 导入</el-button>
          </el-upload>
          <el-button type="primary" @click="handleCreate">新增题目</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="bank_name" label="所属题库" width="160" show-overflow-tooltip />
      <el-table-column label="题型" width="100">
        <template #default="{ row }">{{ questionTypeLabel(row.question_type) }}</template>
      </el-table-column>
      <el-table-column prop="title" label="题目" min-width="260" show-overflow-tooltip />
      <el-table-column prop="correct_answer" label="正确答案" width="160" show-overflow-tooltip />
      <el-table-column prop="sort_no" label="排序" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
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

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑题目' : '新增题目'" width="760px" destroy-on-close>
    <el-form label-width="90px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="所属题库">
            <el-select v-model="form.bank_id" class="w-full">
              <el-option v-for="bank in banks" :key="bank.id" :label="bank.name" :value="bank.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="题型">
            <el-select v-model="form.question_type" class="w-full">
              <el-option :value="1" label="单选题" />
              <el-option :value="2" label="填空题" />
              <el-option :value="3" label="问答题" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="题目内容">
        <el-input v-model="form.title" type="textarea" :rows="4" />
      </el-form-item>
      <template v-if="isSingleChoice">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="选项A"><el-input v-model="form.option_a" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="选项B"><el-input v-model="form.option_b" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="选项C"><el-input v-model="form.option_c" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="选项D"><el-input v-model="form.option_d" /></el-form-item></el-col>
        </el-row>
      </template>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="正确答案">
            <el-input v-model="form.correct_answer" :placeholder="isSingleChoice ? 'A/B/C/D' : '填写标准答案'" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序号">
            <el-input-number v-model="form.sort_no" :min="0" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="答案解析">
        <el-input v-model="form.analysis" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>
