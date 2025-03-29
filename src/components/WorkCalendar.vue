<template>
  <div class="calendar-container">
    <div class="header">
      <h2>我的排班日历</h2>
      <p class="subtitle">上班→下夜班→休息→循环</p>
    </div>

    <div class="controls">
      <div class="year-month-controls">
        <van-button type="primary" size="small" @click="prevYear" icon="arrow-left">上一年</van-button>
        <h3 class="year-display">{{ currentYear }}年</h3>
        <van-button type="primary" size="small" @click="nextYear" icon="arrow">下一年</van-button>
      </div>
      <div class="year-month-controls">
        <van-button type="primary" size="small" @click="prevMonth" icon="arrow-left">上个月</van-button>
        <h3 class="month-display">{{ currentMonth }}月</h3>
        <van-button type="primary" size="small" @click="nextMonth" icon="arrow">下个月</van-button>
      </div>
    </div>
    
    <div class="calendar-wrapper">
      <van-calendar 
        :show-title="false"
        :show-confirm="false"
        :poppable="false"
        :min-date="minDate"
        :max-date="maxDate"
        :formatter="formatter"
        @select="onClickDay"
        :default-date="currentDate"
        :style="{ height: '500px' }"
        :show-mark="false"
        color="#1989fa"
        :pager-visible="true"
        :show-month-title="true"
        :allow-same-day="true"
        @update:show-title="false"
        show-title-month
      />
    </div>

    <div class="legend">
      <div class="legend-title">班次图例：</div>
      <div class="legend-items">
        <div class="legend-item">
          <div class="color-box day"></div>
          <span>白班</span>
        </div>
        <div class="legend-item">
          <div class="color-box night"></div>
          <span>下夜班</span>
        </div>
        <div class="legend-item">
          <div class="color-box rest"></div>
          <span>休息</span>
        </div>
      </div>
    </div>


    <van-popup 
      v-model:show="showShiftEdit" 
      position="bottom" 
      round 
      closeable
      :overlay="true"
      :close-on-click-overlay="true"
      :style="{ height: '40%', maxWidth: '600px', left: '50%', transform: 'translateX(-50%)' }"
    >
      <div class="shift-editor">
        <div class="shift-editor-header">
          <h3>{{ formatDate(selectedDate) }} 调整排班</h3>
          <p class="shift-editor-tip">选择该日期的班次类型</p>
        </div>
        <van-radio-group v-model="selectedShiftType" class="shift-type-group">
          <van-radio name="day" icon-size="24px">白班</van-radio>
          <van-radio name="night" icon-size="24px">下夜班</van-radio>
          <van-radio name="rest" icon-size="24px">休息</van-radio>
        </van-radio-group>
        <div class="action-buttons">
          <van-button type="default" size="large" @click="showShiftEdit = false">取消</van-button>
          <van-button type="primary" size="large" @click="saveShiftChange">保存</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import dayjs from 'dayjs';
import { showToast, showDialog } from 'vant';

// 日期范围设置
const minDate = new Date(2023, 0, 1);
const maxDate = new Date(2030, 11, 31);
const currentDate = ref(new Date());
const selectedDate = ref(null);
const selectedShiftType = ref('');
const showShiftEdit = ref(false);

// 自定义排班数据
const customShifts = ref({});

// 计算当前年和月
const currentYear = computed(() => {
  return dayjs(currentDate.value).year();
});

const currentMonth = computed(() => {
  return dayjs(currentDate.value).month() + 1; // dayjs月份从0开始
});

// 获取某天的排班类型
function getShiftType(date) {
  const dateStr = formatDate(date);
  
  // 如果有自定义排班，优先使用自定义的
  if (customShifts.value[dateStr]) {
    return customShifts.value[dateStr];
  }
  
  // 否则根据规则计算（白班→下夜班→休息→循环）
  // 从2023-01-01开始计算基准
  const baseDate = new Date(2023, 0, 1);
  const diffDays = Math.floor((date - baseDate) / (24 * 60 * 60 * 1000));
  const cycleDay = diffDays % 3;
  
  switch (cycleDay) {
    case 0: return 'day';  // 白班
    case 1: return 'night'; // 下夜班
    case 2: return 'rest';  // 休息
    default: return '';
  }
}

// 日历单元格格式化
function formatter(day) {
  const date = day.date;
  const shiftType = getShiftType(date);
  
  let className = '';
  let bottomInfo = '';
  
  switch (shiftType) {
    case 'day':
      className = 'day-shift';
      bottomInfo = '白班';
      break;
    case 'night':
      className = 'night-shift';
      bottomInfo = '下夜班';
      break;
    case 'rest':
      className = 'rest-day';
      bottomInfo = '休息';
      break;
  }
  
  return {
    ...day,
    className,
    bottomInfo,
  };
}

// 点击日期，打开调整排班弹窗
function onClickDay(date) {
  // 适应 select 事件，直接传入的是 date 对象
  selectedDate.value = date;
  const shiftType = getShiftType(date);
  selectedShiftType.value = shiftType;
  showShiftEdit.value = true;
  console.log('点击日期', formatDate(date), '弹窗状态:', showShiftEdit.value);
}

// 保存排班调整
function saveShiftChange() {
  if (!selectedDate.value) return;
  
  const dateStr = formatDate(selectedDate.value);
  const originalShiftType = getShiftType(selectedDate.value);
  const newShiftType = selectedShiftType.value;
  
  console.log('保存排班:', dateStr, '从', originalShiftType, '到', newShiftType);
  
  // 如果班次类型没有变化，直接返回
  if (originalShiftType === newShiftType) {
    showShiftEdit.value = false;
    return;
  }
  
  // 保存当前日期的排班调整
  customShifts.value[dateStr] = newShiftType;
  
  // 使用新的自动更新方法调整后续30天的排班
  updateFollowingShifts(selectedDate.value, originalShiftType, newShiftType);
  
  // 强制刷新日历显示
  // 先切换到下一天，然后再切回来，触发视图刷新
  const originalDate = new Date(currentDate.value);
  const tempDate = new Date(originalDate);
  tempDate.setDate(originalDate.getDate() + 1);
  currentDate.value = tempDate;
  
  // 用设置超短延时的setTimeout替代nextTick
  setTimeout(() => {
    currentDate.value = originalDate;
  }, 50);
  
  // 存储到localStorage
  localStorage.setItem('customShifts', JSON.stringify(customShifts.value));
  
  showShiftEdit.value = false;
  showToast(`排班已从${originalShiftType === 'day' ? '白班' : originalShiftType === 'night' ? '下夜班' : '休息'}调整为${newShiftType === 'day' ? '白班' : newShiftType === 'night' ? '下夜班' : '休息'}，后续日期已自动更新`);
}

// 查找未来n天内指定班次类型的下一个日期
function findNextDayWithShiftType(startDate, daysToCheck, shiftType) {
  const start = dayjs(startDate).add(1, 'day').toDate(); // 从下一天开始查找
  
  for (let i = 0; i < daysToCheck; i++) {
    const checkDate = dayjs(start).add(i, 'day').toDate();
    if (getShiftType(checkDate) === shiftType) {
      return checkDate;
    }
  }
  
  return null; // 未找到符合条件的日期
}

// 更新后续排班
function updateFollowingShifts(changedDate, originalShiftType, newShiftType) {
  // 排班循环顺序: 白班(上班)→下夜班→休息
  const shiftCycle = ['day', 'night', 'rest'];
  
  // 获取当前选中日期的排班在循环中的位置
  const currentShiftPosition = shiftCycle.indexOf(newShiftType);
  if (currentShiftPosition === -1) return; // 排班类型无效
  
  console.log(`当前日期: ${formatDate(changedDate)}, 排班改为 ${newShiftType}`);
  
  // 清除所有后续手动设置的排班，以确保循环正确
  // 这应该是用户想要的效果

  // 从当前日期开始，严格按照循环更新后续排班
  for (let i = 1; i <= 30; i++) {
    // 计算下一天的日期（使用新的Date对象避克混淆）
    const nextDate = new Date(changedDate.getTime());
    nextDate.setDate(changedDate.getDate() + i);
    const nextDateStr = formatDate(nextDate);
    
    // 计算下一天应该的排班类型
    // 直接根据当前日期的班次类型和偏移量计算
    const nextPosition = (currentShiftPosition + i) % 3;
    const nextShiftType = shiftCycle[nextPosition];
    
    // 更新排班
    customShifts.value[nextDateStr] = nextShiftType;
    console.log(`已设置 ${nextDateStr} 的排班为 ${nextShiftType}`);
  }
  
  console.log('已成功按固定循环设置后续30天排班');
}

// 上个月
function prevMonth() {
  currentDate.value = dayjs(currentDate.value).subtract(1, 'month').toDate();
}

// 下个月
function nextMonth() {
  currentDate.value = dayjs(currentDate.value).add(1, 'month').toDate();
}

// 上一年
function prevYear() {
  currentDate.value = dayjs(currentDate.value).subtract(1, 'year').toDate();
}

// 下一年
function nextYear() {
  currentDate.value = dayjs(currentDate.value).add(1, 'year').toDate();
}

// 格式化日期为YYYY-MM-DD
function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

// 监听弹窗状态变化
watch(showShiftEdit, (newVal) => {
  console.log('弹窗状态变化:', newVal);
});

// 加载保存的自定义排班
onMounted(() => {
  console.log('组件已挂载');
  const savedShifts = localStorage.getItem('customShifts');
  if (savedShifts) {
    customShifts.value = JSON.parse(savedShifts);
  }
});


</script>

<style scoped>
.calendar-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eaeaea;
}

.header h2 {
  color: #333;
  margin-bottom: 8px;
  font-size: 24px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.year-month-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.year-display, .month-display {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.calendar-wrapper {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.shift-editor {
  padding: 24px 20px;
}

.shift-editor-header {
  margin-bottom: 20px;
  text-align: center;
}

.shift-editor-header h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: #333;
}

.shift-editor-tip {
  color: #666;
  font-size: 14px;
}

.shift-type-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  gap: 12px;
}

.action-buttons .van-button {
  flex: 1;
}

.legend {
  margin-top: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.legend-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.legend-items {
  display: flex;
  justify-content: space-around;
}

.legend-item {
  display: flex;
  align-items: center;
}

.color-box {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  border-radius: 4px;
}

.color-box.day {
  background-color: #1989fa;
}

.color-box.night {
  background-color: #7232dd;
}

.color-box.rest {
  background-color: #07c160;
}

/* 自定义日历单元格样式 */
:deep(.day-shift) {
  background-color: rgba(25, 137, 250, 0.1);
  color: #1989fa;
  font-weight: 600;
}

:deep(.night-shift) {
  background-color: rgba(114, 50, 221, 0.1);
  color: #7232dd;
  font-weight: 600;
}

:deep(.rest-day) {
  background-color: rgba(7, 193, 96, 0.1);
  color: #07c160;
  font-weight: 600;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .calendar-container {
    padding: 12px;
    border-radius: 0;
    box-shadow: none;
  }
  
  .header h2 {
    font-size: 20px;
  }
  
  .year-month-controls {
    padding: 6px 10px;
  }
  
  .year-display, .month-display {
    font-size: 16px;
  }
  
  .legend-items {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
