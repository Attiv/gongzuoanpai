<script setup>
import WorkCalendar from './components/WorkCalendar.vue';
</script>

<template>
  <div class="app-container">
    <header>
      <h1>我的排班日历</h1>
    </header>
    <main>
      <WorkCalendar />
    </main>
    <footer>
      <p>© {{ new Date().getFullYear() }} 排班日历</p>
    </footer>
  </div>
</template>

<style>
/* 全局样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f8f8f8;
}

/* 响应式容器 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: #1989fa;
  color: white;
  padding: 1rem;
  text-align: center;
}

main {
  flex: 1;
  padding: 0.5rem;
}

footer {
  text-align: center;
  padding: 1rem;
  font-size: 0.8rem;
  color: #666;
  background-color: #f0f0f0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  h1 {
    font-size: 1.5rem;
  }
  
  main {
    padding: 0.5rem;
  }
  
  :root {
    font-size: 14px;
  }
}
</style>
