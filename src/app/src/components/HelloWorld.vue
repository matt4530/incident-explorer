<script setup>
import { ref } from 'vue'


defineProps({
  msg: String,
})

const count = ref(0)
const heatmap = ref([])
const subset = ref([])

const incidents_path = `/incidents_summary.json`;

getHeatmap();

async function getHeatmap() {
  
  const remoteData = await (await fetch(incidents_path)).json();
  remoteData.forEach(d => d.count = 1);
  heatmap.value = remoteData;
}
function onHeatmapClick(target) {
  const { date } = target;
  
  const properDate = new Date(date);
  const key = "" + properDate.getFullYear() + properDate.getMonth();
  subset.value = heatmap.value.filter(x => {
    const d = new Date(x.date);
    const k = "" + d.getFullYear() + d.getMonth();
    return k == key;
  })
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Install
    <a href="https://github.com/vuejs/language-tools" target="_blank">Volar</a>
    in your IDE for a better DX
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>

  <p v-if="heatmap.length >= 0">Heatmap:{{ heatmap.length }}</p>

  <calendar-heatmap 
  :style="{'max-width':'145px'}"
  :end-date="+new Date()"
  :round="0"
  vertical
  :values="heatmap" 
  :max="21"
  :tooltipUnit="'incidents'"
  @itemClick="onHeatmapClick"
  />
  <!-- :values="[{ date: 1704750906000, count: 6 }, { date: 1704753462000, count: 1 }]" -->

  {{ subset }}

</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
