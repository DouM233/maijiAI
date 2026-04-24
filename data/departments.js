window.MAIJI_DEPARTMENTS = [
  {
    name: "视觉设计一部",
    people: 40,
    teams: [
      { name: "设计部A组", people: 9 },
      { name: "设计部B组", people: 11 },
      { name: "设计部C组", people: 9 },
      { name: "设计部D组", people: 4 },
      { name: "渲染A组", people: 4 },
      { name: "渲染B组", people: 4 },
      { name: "渲染C组", people: 4 }
    ]
  },
  {
    name: "天猫运营部",
    people: 54,
    teams: [
      { name: "天猫一部", people: 10 },
      { name: "天猫二部", people: 9 },
      { name: "天猫三部", people: 5 },
      { name: "天猫四部", people: 10 },
      { name: "天猫五部", people: 8 },
      { name: "天猫六部", people: 5 },
      { name: "天猫七部", people: 7 }
    ]
  },
  {
    name: "京东运营部",
    people: 36,
    teams: [
      { name: "京东一部", people: 12 },
      { name: "京东二部", people: 7 },
      { name: "京东三部", people: 10 },
      { name: "京东四部", people: 7 }
    ]
  },
  {
    name: "京东运维部",
    people: 10,
    teams: [
      { name: "A组", people: 4 },
      { name: "B组", people: 2 },
      { name: "C组", people: 4 }
    ]
  }
];

window.MAIJI_USERS = [
  { name: "陈晓宇", department: "天猫运营部", team: "天猫四部", role: "运营负责人", quota: 92, experts: 5 },
  { name: "林佳宁", department: "视觉设计一部", team: "设计部B组", role: "资深设计师", quota: 68, experts: 4 },
  { name: "周启明", department: "京东运营部", team: "京东一部", role: "店铺运营", quota: 76, experts: 4 },
  { name: "李仕齐", department: "京东运维部", team: "A组", role: "运维主管", quota: 44, experts: 3 },
  { name: "梁丽娟", department: "京东运维部", team: "B组", role: "运维助理", quota: 31, experts: 2 }
];

window.MAIJI_RISK_SESSIONS = [
  {
    user: "陈晓宇",
    role: "运营负责人",
    department: "天猫运营部",
    team: "天猫四部",
    riskType: "额度风险",
    detail: "连续高频调用 Pro 模型，今日 Token 使用 92%",
    expert: "天猫竞争策略教练"
  },
  {
    user: "林佳宁",
    role: "资深设计师",
    department: "视觉设计一部",
    team: "设计部B组",
    riskType: "敏感文件",
    detail: "上传文件疑似包含客户敏感信息，待管理员复核",
    expert: "个人访谈官"
  },
  {
    user: "周启明",
    role: "店铺运营",
    department: "京东运营部",
    team: "京东一部",
    riskType: "异常调用",
    detail: "竞争策略专家调用量异常升高，建议复盘任务来源",
    expert: "电商管理落地顾问"
  }
];
