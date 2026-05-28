# QuickDist 后端服务

答题系统后端服务，基于 Express + SQLite + Sequelize 构建。

## 项目结构

```
src/
├── config/          # 配置文件
│   ├── database.js  # 数据库配置
│   └── jwt.js       # JWT 配置
├── middleware/      # 中间件
│   ├── auth.js      # 认证中间件
│   └── publicAuth.js # 公开接口认证中间件
├── models/          # 数据模型
│   ├── User.js
│   ├── QuizBank.js
│   ├── QuizQuestion.js
│   ├── QuizActivity.js
│   ├── StudentNo.js
│   ├── Participant.js
│   └── index.js
├── controllers/     # 控制器
│   ├── authController.js
│   ├── quizController.js
│   ├── activityController.js
│   ├── statsController.js
│   ├── studentNoController.js
│   ├── userController.js
│   ├── publicQuizController.js
│   └── adminController.js
├── routes/          # 路由
│   ├── auth.js
│   ├── quiz.js
│   ├── studentNo.js
│   ├── user.js
│   ├── publicQuiz.js
│   └── admin.js
└── index.js         # 主入口文件
```

## 安装依赖

```bash
npm install
```

## 运行服务

```bash
npm start
```

服务将在 http://localhost:3000 启动

## 默认管理员账号

- 用户名: `admin`
- 密码: `root123`

## API 接口

### 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 退出登录

### 题库管理
- `GET /api/quiz/banks` - 获取题库列表
- `GET /api/quiz/banks/:id` - 获取题库详情
- `POST /api/quiz/banks` - 创建题库
- `PUT /api/quiz/banks/:id` - 更新题库
- `DELETE /api/quiz/banks/:id` - 删除题库

### 题目管理
- `GET /api/quiz/questions` - 获取题目列表
- `GET /api/quiz/questions/:id` - 获取题目详情
- `POST /api/quiz/questions` - 创建题目
- `PUT /api/quiz/questions/:id` - 更新题目
- `DELETE /api/quiz/questions/:id` - 删除题目
- `POST /api/quiz/questions/import` - 批量导入题目

### 活动管理
- `GET /api/quiz/activities` - 获取活动列表
- `GET /api/quiz/activities/:id` - 获取活动详情
- `POST /api/quiz/activities` - 创建活动
- `PUT /api/quiz/activities/:id` - 更新活动
- `DELETE /api/quiz/activities/:id` - 删除活动

### 活动统计
- `GET /api/quiz/activities/:id/stats?type=overview` - 概览统计
- `GET /api/quiz/activities/:id/stats?type=personal` - 个人排行
- `GET /api/quiz/activities/:id/stats?type=class` - 班级排行
- `GET /api/quiz/activities/:id/stats?type=grade` - 年级排行

### 学号管理
- `GET /api/student-nos` - 获取学号列表
- `GET /api/student-nos/:id` - 获取学号详情
- `POST /api/student-nos` - 创建学号
- `PUT /api/student-nos/:id` - 更新学号
- `DELETE /api/student-nos/:id` - 删除学号
- `POST /api/student-nos/import` - 批量导入学号

### 用户管理
- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取用户详情
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 公开答题接口
- `GET /api/quiz/public/activity` - 获取活动信息（需要活动 token）
- `POST /api/quiz/public/check-student-no` - 验证学号
- `POST /api/quiz/public/login` - 学生登录
- `POST /api/quiz/public/progress` - 提交答题进度
- `GET /api/quiz/public/result/:participantId` - 获取答题结果

### 管理员接口
- `POST /api/admin/trial` - 创建试用申请

## 数据库

使用 SQLite 数据库，数据库文件位于 `src/config/database.sqlite`，首次运行时会自动创建。

## 认证方式

除登录接口外，所有管理接口需要在请求头中携带 JWT token：

```
Authorization: Bearer <token>
```

公开答题接口使用活动 token 进行认证。

## 打包部署

### Windows 打包

```bash
npm run pkg
```

打包完成后会生成：
- `dist/quick-dist.exe` - 可执行文件
- `dist.zip` - 完整部署包（包含可执行文件和前端资源）

### Linux 打包

```bash
npm run pkg:linux
```

### macOS 打包

```bash
npm run pkg:mac
```

### 部署说明

1. 将 `dist.zip` 解压到目标服务器
2. 直接运行 `quick-dist.exe`（Windows）或 `quick-dist`（Linux/Mac）
3. 服务默认运行在 3000 端口
4. 首次运行会自动创建数据库文件和默认管理员账号

**注意：** 打包后的可执行文件会自动包含 sqlite3 原生依赖，无需额外安装。
