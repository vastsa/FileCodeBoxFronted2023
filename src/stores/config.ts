import { defineStore } from 'pinia'
import { ref } from 'vue'

type Config = Record<string, any>

export const DEFAULT_EXPIRE_STYLES = ['day', 'hour', 'minute', 'forever', 'count']

export const DEFAULT_THEME_CHOICES = [
  { name: '2023', key: 'themes/2023' },
  { name: '2024', key: 'themes/2024' },
]

const DEFAULT_CONFIG: Config = {
  explain: '',
  upload_size: 10 * 1024 * 1024,
  allowed_file_types: ['*'],
  expire_style: DEFAULT_EXPIRE_STYLES,
  enable_chunk: 0,
  open_upload: 1,
  notify_title: '',
  notify_content: '',
  show_admin_address: 0,
  max_save_seconds: 0,
  themes_choices: DEFAULT_THEME_CHOICES,
}

// 2.6.1 之前的后端和已缓存的配置使用驼峰键。保留兼容读取，避免升级后
// 旧 localStorage 让页面在新配置异步返回前访问到 undefined。
const LEGACY_CONFIG_KEYS: Record<string, string> = {
  uploadSize: 'upload_size',
  allowedFileTypes: 'allowed_file_types',
  expireStyle: 'expire_style',
  enableChunk: 'enable_chunk',
  openUpload: 'open_upload',
  showAdminAddr: 'show_admin_addr',
  showAdminAddress: 'show_admin_address',
  maxSaveSeconds: 'max_save_seconds',
  themesChoices: 'themes_choices',
  themesSelect: 'themes_select',
  robotsText: 'robots_text',
  uploadMinute: 'upload_minute',
  uploadCount: 'upload_count',
  errorMinute: 'error_minute',
  errorCount: 'error_count',
  loginCount: 'login_count',
  loginMinute: 'login_minute',
  adminSessionExpire: 'admin_session_expire',
  storageLimit: 'storage_limit',
  serverHost: 'server_host',
  serverPort: 'server_port',
  serverWorkers: 'server_workers',
  trustedProxies: 'trusted_proxies',
}

export function normalizeConfig(value: unknown): Config {
  const source: Config =
    value && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Config) }
      : {}

  for (const [legacyKey, currentKey] of Object.entries(LEGACY_CONFIG_KEYS)) {
    if (
      (source[currentKey] === undefined || source[currentKey] === null) &&
      source[legacyKey] !== undefined
    ) {
      source[currentKey] = source[legacyKey]
    }
    delete source[legacyKey]
  }

  return { ...DEFAULT_CONFIG, ...source }
}

function readStoredConfig(): Config {
  try {
    const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem('config')
    return normalizeConfig(stored ? JSON.parse(stored) : {})
  } catch {
    return normalizeConfig({})
  }
}

export const useConfigStore = defineStore('config', () => {
  // 使用稳定的对象引用：旧代码通过 destructuring 读取 config，原地合并才能
  // 让这些引用在 App.vue 的异步配置请求完成后继续保持响应式更新。
  const config: any = ref(readStoredConfig())

  const setConfig = (value: unknown) => {
    const nextConfig = normalizeConfig(value)

    for (const key of Object.keys(config.value)) {
      if (!(key in nextConfig)) {
        delete config.value[key]
      }
    }
    Object.assign(config.value, nextConfig)

    try {
      localStorage.setItem('config', JSON.stringify(config.value))
    } catch {
      // localStorage 不可用时仍保留内存中的配置，不能阻断页面启动。
    }
  }

  return { config, setConfig }
})
