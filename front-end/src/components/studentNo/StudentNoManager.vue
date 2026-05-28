<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import {
  createStudentNo,
  deleteStudentNo,
  importStudentNos,
  listStudentNos,
  updateStudentNo,
} from '../../api/studentNo'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const rows = ref([])
const pagination = reactive({ page: 1, page_size: 10, total: 0 })
const query = reactive({ keyword: '', school_name: '', grade_name: '', class_name: '', status: undefined })
const form = reactive({ id: null, student_no: '', school_name: '', class_name: '', grade_name: '', status: 1 })

function resetForm() {
  form.id = null
  form.student_no = ''
  form.school_name = ''
  form.class_name = ''
  form.grade_name = ''
  form.status = 1
}

async function loadData() {
  loading.value = true
  try {
    const res = await listStudentNos({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: query.keyword || undefined,
      school_name: query.school_name || undefined,
      grade_name: query.grade_name || undefined,
      class_name: query.class_name || undefined,
      status: query.status,
    })
    rows.value = res.data.rows
    pagination.total = res.data.total
  } catch (err) {
    ElMessage.error(err.message || '加载学号列表失败')
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
  form.student_no = row.student_no
  form.school_name = row.school_name
  form.class_name = row.class_name
  form.grade_name = row.grade_name
  form.status = row.status
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.student_no.trim()) return ElMessage.warning('请输入学号')
  if (!form.grade_name.trim()) return ElMessage.warning('请输入年级')
  if (!form.class_name.trim()) return ElMessage.warning('请输入班级')

  saving.value = true
  try {
    const payload = {
      student_no: form.student_no.trim(),
      school_name: form.school_name.trim() || undefined,
      grade_name: form.grade_name.trim(),
      class_name: form.class_name.trim(),
      status: form.status,
    }
    if (form.id) {
      await updateStudentNo(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createStudentNo(payload)
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
    await ElMessageBox.confirm(`确认删除学号“${row.student_no}”吗？`, '提示', { type: 'warning' })
    await deleteStudentNo(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.message || '删除失败')
  }
}

function downloadTemplate() {
  const template = [
    {
      学号: '20260001',
      学校: '第一实验小学',
      年级: '三年级',
      班级: '三年级1班',
      状态: 1,
    },
  ]
  const sheet = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, '学号模板')
  XLSX.writeFile(wb, '学号导入模板.xlsx')
}

async function onImportFileChange(uploadFile) {
  try {
    const file = uploadFile.raw
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    if (!jsonRows.length) return ElMessage.warning('Excel 中没有可导入数据')

    const importRows = jsonRows
      .map((item) => ({
        student_no: String(item.学号 || '').trim(),
        school_name: String(item.学校 || '').trim(),
        grade_name: String(item.年级 || '').trim(),
        class_name: String(item.班级 || '').trim(),
        status: item.状态 === '' || item.状态 === null || item.状态 === undefined ? 1 : Number(item.状态),
      }))
      .filter((item) => item.student_no)

    await importStudentNos({ rows: importRows })
    ElMessage.success(`成功导入 ${importRows.length} 条学号信息`)
    await loadData()
  } catch (err) {
    ElMessage.error(err.message || '导入失败')
  }
  return false
}

onMounted(loadData)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="text-base font-semibold">学号管理</div>
        <div class="flex items-center gap-3 flex-wrap">
          <el-input v-model="query.keyword" placeholder="搜索学号" clearable class="w-200px" @keyup.enter="loadData" />
          <el-input v-model="query.school_name" placeholder="学校" clearable class="w-160px" @keyup.enter="loadData" />
          <el-input v-model="query.grade_name" placeholder="年级" clearable class="w-140px" @keyup.enter="loadData" />
          <el-input v-model="query.class_name" placeholder="班级" clearable class="w-160px" @keyup.enter="loadData" />
          <el-select v-model="query.status" placeholder="状态" clearable class="w-120px">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="停用" />
          </el-select>
          <el-button @click="loadData">查询</el-button>
          <el-button @click="downloadTemplate">下载模板</el-button>
          <el-upload :show-file-list="false" accept=".xlsx,.xls" :auto-upload="false" :on-change="onImportFileChange">
            <el-button>Excel 导入</el-button>
          </el-upload>
          <el-button type="primary" @click="handleCreate">新增学号</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="student_no" label="学号" min-width="160" />
      <el-table-column prop="school_name" label="学校" min-width="180" show-overflow-tooltip />
      <el-table-column prop="grade_name" label="年级" min-width="140" show-overflow-tooltip />
      <el-table-column prop="class_name" label="班级" min-width="180" show-overflow-tooltip />
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

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑学号' : '新增学号'" width="520px">
    <el-form label-width="90px">
      <el-form-item label="学号">
        <el-input v-model="form.student_no" maxlength="80" />
      </el-form-item>
      <el-form-item label="学校">
        <el-input v-model="form.school_name" maxlength="120" />
      </el-form-item>
      <el-form-item label="年级">
        <el-input v-model="form.grade_name" maxlength="80" />
      </el-form-item>
      <el-form-item label="班级">
        <el-input v-model="form.class_name" maxlength="80" />
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
