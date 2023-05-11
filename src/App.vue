<template>
  <div class="model-container">
    <ModelWin />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ModelWin from "./components/ModelWin.vue";

export default defineComponent({
  name: "App",
  components: {
    ModelWin,
  },
});
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.model-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
