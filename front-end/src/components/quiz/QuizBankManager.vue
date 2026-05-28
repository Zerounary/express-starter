<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createQuizBank, deleteQuizBank, listQuizBanks, updateQuizBank } from '../../api/quiz'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const rows = ref([])
const pagination = reactive({ page: 1, page_size: 10, total: 0 })
const query = reactive({ keyword: '', status: undefined })
const form = reactive({ id: null, name: '', description: '', status: 1 })

function resetForm() {
  form.id = null
  form.name = ''
  form.description = ''
  form.status = 1
}

async function loadData() {
  loading.value = true
  try {
    const res = await listQuizBanks({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: query.keyword || undefined,
      status: query.status,
    })
    rows.value = res.data.rows
    pagination.total = res.data.total
  } catch (err) {
    ElMessage.error(err.message || '加载题库失败')
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
  form.name = row.name
  form.description = row.description || ''
  form.status = row.status
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入题库名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      status: form.status,
    }
    if (form.id) {
      await updateQuizBank(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createQuizBank(payload)
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
    await ElMessageBox.confirm(`确认删除题库“${row.name}”吗？`, '提示', { type: 'warning' })
    await deleteQuizBank(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.message || '删除失败')
  }
}

onMounted(loadData)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="text-base font-semibold">题库管理</div>
        <div class="flex items-center gap-3 flex-wrap">
          <el-input v-model="query.keyword" placeholder="搜索题库名称" clearable class="w-220px" @keyup.enter="loadData" />
          <el-select v-model="query.status" placeholder="状态" clearable class="w-120px">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="停用" />
          </el-select>
          <el-button @click="loadData">查询</el-button>
          <el-button type="primary" @click="handleCreate">新增题库</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="name" label="题库名称" min-width="180" />
      <el-table-column prop="description" label="简介" min-width="220" show-overflow-tooltip />
      <el-table-column prop="question_count" label="题目数" width="100" />
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

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑题库' : '新增题库'" width="520px">
    <el-form label-width="90px">
      <el-form-item label="题库名称">
        <el-input v-model="form.name" maxlength="120" />
      </el-form-item>
      <el-form-item label="题库简介">
        <el-input v-model="form.description" type="textarea" :rows="4" />
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
