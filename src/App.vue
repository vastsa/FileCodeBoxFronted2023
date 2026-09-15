<script setup lang="ts">
import { onMounted } from 'vue'
import { ElNotification } from 'element-plus'
import { request } from '@/utils/request'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()

onMounted(() => {
  request({
    url: '/',
    method: 'post',
  }).then((res: any) => {
    if (res.code === 200) {
      // 更新 Pinia 中现有的配置对象；只写 localStorage 不会让已经挂载的
      // 页面看到新配置，且旧缓存中的驼峰键会让 snake_case 页面初始化失败。
      configStore.setConfig(res.detail)

      if (
        res.detail.notify_title &&
        res.detail.notify_content &&
        localStorage.getItem('notify') !== res.detail.notify_title + res.detail.notify_content
      ) {
        localStorage.setItem('notify', res.detail.notify_title + res.detail.notify_content)
        ElNotification({
          title: res.detail.notify_title,
          dangerouslyUseHTMLString: true,
          message: res.detail.notify_content,
          type: 'success',
        })
      }
    }
  })
})
</script>

<template>
  <div>
    <RouterView />
  </div>
</template>

<style scoped></style>
