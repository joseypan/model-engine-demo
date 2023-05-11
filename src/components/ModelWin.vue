<!--
* @FileDescription:用来展示模型的显示组件 
* @Author: 潘旭敏
* @Date: 2022-06-24 14:09
* @LastEditors: 潘旭敏
* @LastEditTime: 2022-06-24 14:09
-->
<template>
  <div class="container" id="model-container">
    <canvas id="model-id" ref="modelRef" class="model-content"></canvas>
    <!-- 框选功能 -->
    <button class="select-box-start" @click="openSelectionHandler">
      开启框选功能
    </button>
    <button class="select-box-end" @click="closeSelectionHandler">
      关闭框选功能
    </button>
    <!-- 加载模型的结构树列表 -->
    <div id="construction-list">
      <ul></ul>
    </div>
    <!-- 加载多个模型列表 -->
    <ul id="model-list">
      <li v-for="(item, index) in modelList" :key="index">
        <input type="checkbox" v-model="item.isCheck" />
        <span>{{ item.name }}</span>
      </li>
      <button @click="handleModelChange">加载模型</button>
    </ul>
  </div>
</template>
<script lang="ts" setup>
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  defineProps,
  defineEmits,
  reactive,
} from "vue";
import {
  drawModelView,
  getId,
  handleCancelAnimation,
  injectGroupSelfRotation,
  removeGroupSelfRotation,
  injectWindowResize,
  onDocumentMouseDown,
  removeWindowResize,
  convertPosition,
  getAllMeshPosition,
  IMeshPosition,
  get3DPosByCanvasPos,
  startSelectionBox,
  endSelectionBox,
  changeModel,
} from "@/utils/modelRender/index";
import { debounce } from "lodash";
/*
 * 描述：展示状态枚举
 * 其他说明：
 */
enum ViewStatus {
  /*
   * 描述：展示成功
   * 其他说明：用户可以在浏览器端成功打开该转换后的模型
   */
  VIEW_SUCCESS = "VIEW_SUCCESS",
  /*
   * 描述：展示失败
   * 其他说明：用户在浏览器端预览模型失败
   */
  VIEW_FAILURE = "VIEW_FAILURE",
  /*
   * 描述：等待展示
   * 其他说明：用户打开浏览器准备处理当中
   */
  VIEW_PENDING = "VIEW_PENDING",
  /*
   * 描述：展示创建
   * 其他说明：用户打开浏览器准备处理当中
   */
  VIEW_CREATE = "VIEW_CREATE",
}
const props = defineProps({
  modelConvertedSize: {
    type: Number,
    required: true,
    default: 0,
  },
  modelExportFullPath: {
    type: String,
    required: true,
    default: "",
  },
});
const emit = defineEmits(["handleComponentClick", "handleModelViewResult"]);
// //用来解析地址栏的参数
//step1:找到一个用来承载canvas的容器
let modelRef = ref<any>(null);
/**
 * 描述：用来控制当前鼠标点击事件
 * @param { MouseEvent } event 鼠标事件
 * @return void
 */
const handleMouseDown = (event: MouseEvent) => {
  const modelObject = onDocumentMouseDown(event, modelRef.value);
  // meshPositionMap.value = getAllMeshPosition();
  // console.log(
  //   "modelObject",
  //   modelObject,
  //   modelObject.name,
  //   meshPositionMap.value
  // );
  // if (!meshPositionMap.value) return;
  // const modelPosition = meshPositionMap.value.get(modelObject.name);
  // console.log("down", modelPosition);
  const modelId = getId(modelObject);
  if (!modelId || !meshPositionMap.value) return;
  const modelPosition = meshPositionMap.value.get(modelId);
  // const position = convertPosition(modelObject);
  console.log("down", modelId, modelPosition);
  // const alarmEle = document.getElementById("alarm");
  // if (alarmEle) {
  //   alarmEle.style.left = position.x - 16 + "px";
  //   alarmEle.style.top = position.y - 32 + "px";
  // }
  // 点击获取当前物体对象
  // const componentId = getId(modelObject);
  // emit("handleComponentClick", componentId);
  // const position = get3DPosByCanvasPos({ x: event.offsetX, y: event.offsetY });
  // const alarmEle = document.getElementById("alarm");
  // if (alarmEle) {
  //   alarmEle.style.left = event.offsetX - 16 + "px";
  //   alarmEle.style.top = event.offsetY - 32 + "px";
  // }
};
const modelList = reactive([
  {
    name: "模型1",
    url: "http://61.177.20.107:8000/gtu3d/modelExport/%E5%A4%A7%E9%A1%BE%E5%AE%B6%E5%AE%85%E5%8C%BA%E5%9D%97%E5%8A%A8%E8%BF%81%E5%AE%89%E7%BD%AE%E6%88%BF%E9%A1%B9%E7%9B%AEPC-1%E5%A2%99%E6%9D%BF%E7%AD%89.gltf",
    isCheck: false,
  },
  {
    name: "模型2",
    url: "http://61.177.20.107:8000/gtu3d/modelExport/%E5%A4%A7%E9%A1%BE%E5%AE%B6%E5%AE%85%E5%8C%BA%E5%9D%97%E5%8A%A8%E8%BF%81%E5%AE%89%E7%BD%AE%E6%88%BF%E9%A1%B9%E7%9B%AEPC-2_%E5%A2%99%E6%9D%BF%E7%AD%89.gltf",
    isCheck: false,
  },
  {
    name: "模型3",
    url: "http://61.177.20.107:8000/gtu3d/modelExport/%E5%A4%A7%E9%A1%BE%E5%AE%B6%E5%AE%85%E5%8C%BA%E5%9D%97%E5%8A%A8%E8%BF%81%E5%AE%89%E7%BD%AE%E6%88%BF%E9%A1%B9%E7%9B%AEPC-3.gltf",
    isCheck: false,
  },
  {
    name: "模型4",
    url: "http://61.177.20.107:8000/gtu3d/modelExport/%E5%A4%A7%E9%A1%BE%E5%AE%B6%E5%AE%85%E5%8C%BA%E5%9D%97%E5%8A%A8%E8%BF%81%E5%AE%89%E7%BD%AE%E6%88%BF%E9%A1%B9%E7%9B%AEPC-4.gltf",
    isCheck: false,
  },
  {
    name: "模型5",
    url: "http://61.177.20.107:8000/gtu3d/modelExport/%E5%A4%A7%E9%A1%BE%E5%AE%B6%E5%AE%85%E5%8C%BA%E5%9D%97%E5%8A%A8%E8%BF%81%E5%AE%89%E7%BD%AE%E6%88%BF%E9%A1%B9%E7%9B%AEPC-5.gltf",
    isCheck: false,
  },
]);
/*
 * 描述：mesh映照
 * 其他说明：
 */
const meshPositionMap = ref<Map<string, IMeshPosition>>();
/**
 * 描述：处理模型视图加载
 * @return void
 */
const handleDrawModelView = () => {
  loadingText.value = 0;
  // const modelList = [
  //   // "http://61.177.20.107:8000/gtu3d/modelExport/test23.gltf",
  // ];
  const models = modelList.filter((ele) => ele.isCheck).map((ele) => ele.url);
  console.log("models", models);
  drawModelView(models, modelRef.value, onProgress)
    .then(() => {
      loading.value = false;
      meshPositionMap.value = getAllMeshPosition();
      emit("handleModelViewResult", ViewStatus.VIEW_SUCCESS);
    })
    .catch(() => {
      emit("handleModelViewResult", ViewStatus.VIEW_FAILURE);
    });
};
const handleModelChange = () => {
  const models = modelList.filter((ele) => ele.isCheck).map((ele) => ele.url);
  console.log("models", models);
  changeModel(models, modelRef.value, () => {
    console.log("加载");
  });
};
const onProgress = (xhr: ProgressEvent) => {
  const ratio = Math.round((xhr.loaded / xhr.total) * 100);
  loadingText.value = ratio;
};
let loading = ref(true);
let loadingText = ref(0);
const rotationHandler = () => {
  injectGroupSelfRotation();
};
const rotationDebounceFn = debounce(rotationHandler, 10000);
onMounted(() => {
  nextTick(() => {
    handleDrawModelView();
    // modelRef.value.addEventListener("click", handleMouseDown, true);
    // modelRef.value.addEventListener("mousemove", () => {
    //   removeGroupSelfRotation();
    //   rotationDebounceFn();
    // });
    // injectWindowResize();
    // createLabel("hello world", { x: 0, y: 0, z: 0 });
  });
});
onBeforeUnmount(() => {
  modelRef.value.removeEventListener("click", handleMouseDown);
  handleCancelAnimation();
  removeWindowResize();
});
const openSelectionHandler = () => {
  startSelectionBox();
};
const closeSelectionHandler = () => {
  // startSelectionBox();
  endSelectionBox();
};
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
  .model-content {
    width: 100%;
    height: 100%;
  }
}
.select-box-start {
  position: fixed;
  bottom: 10px;
  left: 10px;
}
.select-box-end {
  position: fixed;
  bottom: 10px;
  left: 100px;
}
#model-list {
  position: fixed;
  top: 60%;
  left: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 5px;
  li {
    list-style: none;
    margin: 10px 0;
    input {
      margin-right: 10px;
    }
  }
}
</style>
