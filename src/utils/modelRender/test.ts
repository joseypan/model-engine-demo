/**
 * @FileDescription:使用threejs实现模型的渲染
 * @Author: 潘旭敏
 * @Date: 2022-08-15 14:59
 * @LastEditors: 潘旭敏
 * @LastEditTime: 2022-08-15 14:59
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import Stats from "stats.js";
import {
  DataTexture,
  Group,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Vector3,
} from "three";
import { cloneDeep } from "lodash";
import { BoxGeometry } from "three";
import { MeshBasicMaterial } from "three";
import { Mesh } from "three";
// import config from "@/config";
/*
 * 描述：渲染器实例
 */
let renderer: typeof WebGLRenderer | null;
/*
 * 描述：声明场景对象
 */
let scene: typeof Scene | null;
/*
 * 描述：用来声明相机变量
 */
let camera: typeof PerspectiveCamera | null;
/*
 * 描述：控制器对象
 */
let controls: OrbitControls | null;
/*
 * 描述：用来声明rgbeLoader实例对象
 */
let rgbeLoader: RGBELoader | null;
/*
 * 描述：用来声明stats实例对象
 */
let stats: Stats | null;
/**
 * 描述：初始化renderer渲染器
 * @return void
 */
const initRenderer = (canvas: HTMLCanvasElement) => {
  //step2:创建一个渲染器(设置透明，让其展示模型的背景颜色)
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
};
/**
 * 描述：初始化场景对象
 * @return void
 */
const initScene = () => {
  //step3:创建一个场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdae3e6);
};
/*
 * 描述：声明相机的角度(常量)
 */
const CAMERA_FOV = 45;
/**
 * 描述：初始化相机对象
 * @return void
 */
const initCamera = () => {
  //step4:创建一个相机
  camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    0.01,
    100
  );
  //场景背景
  camera.position.set(0, 0, 10);
  if (scene) camera.lookAt(scene.position);
};
/**
 * 描述：初始化controls
 * @return void
 */
const initControls = () => {
  if (!camera || !renderer) return;
  controls = new OrbitControls(camera, renderer.domElement);
};

/**
 * 描述：初始化环境光等参数
 * @return void
 */
const initTexture = () => {
  rgbeLoader = new RGBELoader();
  rgbeLoader.setPath("textures/equirectangular/");
  rgbeLoader.load(
    "satara_night_no_lamps_1k.hdr",
    (texture: typeof DataTexture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      if (scene) scene.environment = texture;
    }
  );
};

let animationFrameIns: number | undefined;

/**
 * 描述：进行自转
 * @param {  }
 * @return
 */
const selfRotation = (group?: typeof Group) => {
  if (!group) return;
  group.rotation.y -= 0.01;
};
/*
 * 描述：控制是否旋转的开关阀
 * 其他说明：
 */
let selfRotationFlag = false;

/**
 * 描述：渲染场景
 * @param {  }
 * @return
 */
const renderScene = () => {
  if (!scene || !camera || !renderer || !controls) return;
  stats?.update();
  controls.update();
  if (selfRotationFlag) selfRotation(modelGroup);
  animationFrameIns = requestAnimationFrame(renderScene);
  renderer.render(scene, camera);
};
/**
 * 描述：使得模型加载居中
 * @param { Group } object 模型对象
 * @return undefined
 */
const setModelPosition = (group: typeof Group) => {
  const bbox2 = new THREE.Box3().setFromObject(group);
  group.position.set(
    -(bbox2.max.x + bbox2.min.x) / 2,
    -(bbox2.max.y + bbox2.min.y) / 2,
    -(bbox2.max.z + bbox2.min.z) / 2 - (bbox2.max.z - bbox2.min.z) / 2
  );
};
/**
 * 描述：用来确定模型合适的缩放比
 * @param { Group } group 模型对象组
 * @return void
 */
const getFitScaleValue = (group: typeof Group) => {
  if (!camera) return;
  const bbox = new THREE.Box3().setFromObject(group);
  const mdlen = bbox.max.x - bbox.min.x; //边界的最小坐标值 边界的最大坐标值
  const mdhei = bbox.max.y - bbox.min.y;
  const mdwid = bbox.max.z - bbox.min.z;
  group.position.set(0, 0, 0);
  const dist = Math.abs(camera.position.y - group.position.y - mdhei / 2);
  //【todo】ts提示camera没有fov属性，通过查看ts类型声明，确实没有。但是通过打印知道这个值与设置的new Camera()参数一一致
  const vFov = (CAMERA_FOV * Math.PI) / 180;
  const vheight = 2 * Math.tan(vFov * 0.8) * dist;
  const fraction = mdhei / vheight;
  const finalHeight = 100 * fraction;
  const finalWidth = (finalHeight * mdlen) / mdhei;

  const value1 = 100 / finalWidth;
  const value2 = 100 / finalHeight;
  if (value1 >= value2) {
    group.scale.set(value2, value2, value2);
  } else {
    group.scale.set(value1, value1, value1);
  }
};

/*
 * 描述：用来记录上一个用户点击的构件对象
 */
let lastObject: any = null;
/*
 * 描述：上一个选中构件的颜色集合
 * 其他说明：
 */
const lastComponentItemColor: any[] = [];
/**
 * 描述：判断节点是否有子元素
 * @param { any } currentNode 需要判断的节点
 * @return boolean true表示有 false表示没有
 */
const hasChildren = (currentNode: any) => {
  return !!(
    currentNode &&
    currentNode.children &&
    currentNode.children.length > 0
  );
};
/**
 * 描述：判断节点是否含有material属性
 * @param { any } currentNode 当前节点
 * @return boolean true表示有 false表示没有
 */
const hasMaterial = (currentNode: any) => {
  return !!(currentNode && currentNode.material);
};
/**
 * 描述：按照层级结构获取有效父组件（名字是id+名称的形式）的所有子孙结构颜色,并修改颜色为高亮的颜色
 * @param { any } rootNode 有效父组件的节点
 * @return void
 */
const getMaterialTreeNodeList = (rootNode: any) => {
  if (!rootNode) return;
  const stack = [rootNode];
  while (stack.length) {
    //取出第一项
    const currentNode = stack.shift();
    if (hasChildren(currentNode)) {
      currentNode.children.forEach((ele: any) => {
        stack.push(ele);
      });
    }
    if (hasMaterial(currentNode)) {
      lastComponentItemColor.push(currentNode.material);
      const material = cloneDeep(currentNode.material);
      material.color.set("#00BFFF");
      currentNode.material = material;
    }
  }
};
/**
 * 描述：给上一个有效父节点的所有元素恢复其原本的颜色
 * @param { any } rootNode 有效父节点
 * @return void
 */
const setRawMaterialToNode = (rootNode: any) => {
  if (!rootNode) return;
  const stack = [rootNode];
  while (stack.length) {
    //取出第一项
    const currentNode = stack.shift();
    if (hasChildren(currentNode)) {
      currentNode.children.forEach((ele: any) => {
        stack.push(ele);
      });
    }
    if (hasMaterial(currentNode)) {
      const material = lastComponentItemColor.shift();
      currentNode.material = material;
      // currentNode.material.color.set(color);
    }
  }
};

export const onDocumentMouseDown = (
  event: MouseEvent,
  canvas: HTMLCanvasElement
) => {
  event.preventDefault();
  if (!camera) return;
  const getBoundingClientRect = canvas.getBoundingClientRect();
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  mouse.x =
    ((event.clientX - getBoundingClientRect.left) / canvas.offsetWidth) * 2 - 1;
  mouse.y =
    -((event.clientY - getBoundingClientRect.top) / canvas.offsetHeight) * 2 +
    1;
  raycaster.setFromCamera(mouse, camera);
  // 点击屏幕创建一个向量
  if (!scene) return;
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    // 【疑问】不是很理解为什么只取第一项
    // 因为raycaster是一条射线，当我们点击屏幕的时候，会根据new THREE.Raycaster设置的起始和结束位置生成一条射线，而这条射线可能会穿过多个物体，索引为0的是距离我们最近的物体，所以取索引0
    // https://juejin.cn/post/7116160094261215239
    // const parentNode = getValidParentNode(intersects[0].object);
    const parentNode = intersects[0].object;
    if (parentNode !== lastObject) {
      // 是否需要把之前的颜色都恢复如初？调用渲染方法？
      setRawMaterialToNode(lastObject);
      getMaterialTreeNodeList(parentNode);
    }
    lastObject = parentNode;
    return lastObject;
  } else {
    //用户点击模型外
    setRawMaterialToNode(lastObject);
    lastObject = null;
  }
};
/**
 * 描述：查找当前点击元素的有效祖先元素
 * @param {  }
 * @return
 */
const getValidParentNode = (
  obj: typeof Object3D | null
): typeof Object3D | null => {
  let currentNode = obj;
  // 当用户点击背景的时候，得到的currentNode是undefined
  while (currentNode) {
    if (currentNode.userData.ElementID) {
      break;
    } else {
      currentNode = currentNode.parent;
    }
  }
  return currentNode;
};
/**
 * 描述：查找当前点击构件对应的id,需要先根据构件的name去匹配，如果name不匹配则需要找其parent，直到parent为null结束递归(参考链表的遍历方式)
 * @param { any } obj 构件对象
 * @return string 模型id
 */
export const getId = (obj: typeof Object3D | null): string | null => {
  if (!obj) return null;
  const itemId = obj.userData.ElementID;
  return itemId;
};
//初始化统计对象
// function initStats() {
//   if (!camera) return;
//   stats = new Stats();
//   // 设置统计模式
//   // stats?.setMode(0); // 0: fps, 1: ms
//   // 统计信息显示在左上角
//   stats.dom.style.position = "absolute";
//   stats.dom.style.right = "0px";
//   stats.dom.style.top = "0px";
//   document.getElementById("app")?.appendChild(stats.dom);
// }
const loadEnviroment = () => {
  if (!scene || !camera) return;
  const pointLight = new THREE.PointLight(0xffffff, 0.8, 1000);
  pointLight.position.set(0, 0, 0);
  camera.add(pointLight);
  //给场景增加环境光
  const Ambient = new THREE.AmbientLight(0x404040, 2);
  scene.add(Ambient);
  // 使用直线光来模拟太阳光
  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 10, 10);
  // light.shadow = true;
  scene.add(light);
};
const modelB =
  "http://61.177.20.107:8000/gtu3d/modelExport/%E5%8F%B0%E7%9B%86%E8%8A%82%E7%82%B9.gltf";
const modelA =
  "http://61.177.20.107:8000/gtu3d/modelExport/%E5%8A%A8%E5%8A%9B%E4%B8%AD%E5%BF%83-MEP-%E7%89%88%E6%9C%AC7-1.gltf";
let modelGroup: undefined | typeof Group;
/**
 * 描述：模型初始化的方法
 * @return void
 */
const initModel = (
  modelPath: string,
  canvas: HTMLCanvasElement,
  onProgress: (xhr: ProgressEvent) => void
) => {
  return new Promise((resolve, reject) => {
    if (!canvas || !scene) return;
    loadEnviroment();
    //step5:尝试引入模型
    const loader = new GLTFLoader();
    loader.load(
      modelA,
      (model) => {
        const group = new THREE.Group();
        group.add(model.scene);
        modelGroup = group;
        getFitScaleValue(group);
        setModelPosition(model.scene);
        setAllMeshPosition(model.scene);
        if (scene) {
          scene.add(group);
        }
        resolve("success");
      },
      (xhr: ProgressEvent) => {
        // 可以做一个loading
        onProgress(xhr);
      },
      (error: ErrorEvent) => {
        // 需要通知到后端模型展示失败，并且跳转至展示失败页面
        reject(error);
      }
    );
  });
};

/**
 * 描述：初始化所有的视图数据等
 * @param { string } modelName 模型名称
 * @param { HTMLCanvasElement } canvas 用来渲染模型视图的容器
 * @return
 */
export const drawModelView = (
  modelPath: string,
  canvas: HTMLCanvasElement,
  onProgress: (xhr: ProgressEvent) => void
) => {
  return new Promise((resolve, reject) => {
    initRenderer(canvas);
    initScene();
    initCamera();
    initControls();
    // initStats();
    initTexture();
    renderScene();
    initLabel(canvas);
    // initModel(modelPath, canvas, onProgress).then(resolve).catch(reject);
    initBox();
  });
};
const initBox = () => {
  const geometry1 = new BoxGeometry();
  const material1 = new MeshBasicMaterial({
    color: 0x0000ff,
  });
  const geometry2 = new BoxGeometry();
  const material2 = new MeshBasicMaterial({
    color: 0x0000ff,
  });
  const mesh1 = new Mesh(geometry1, material1);
  const mesh2 = new Mesh(geometry2, material2);
  mesh1.name = "mesh1";
  mesh1.position.x = 5;
  mesh2.name = "mesh2";
  mesh2.position.y = 2;
  scene.add(mesh1);
  scene.add(mesh2);
  setAllMeshPosition(scene);
};
/**
 * 描述：清除requestanimationFrame
 * @return void
 */
export const handleCancelAnimation = () => {
  if (animationFrameIns !== undefined)
    window.cancelAnimationFrame(animationFrameIns);
};

/**
 * 描述：处理视图更新渲染
 * @return
 */
const handleViewUpdate = () => {
  if (!renderer || !camera) return;
  // 重置渲染器输出画布canvas尺寸
  renderer?.setSize(window.innerWidth, window.innerHeight);
  // 全屏情况下：设置观察范围长宽比aspect为窗口宽高比
  camera.aspect = window.innerWidth / window.innerHeight;
  // 渲染器执行render方法的时候会读取相机对象的投影矩阵属性projectionMatrix
  // 但是不会每渲染一帧，就通过相机的属性计算投影矩阵(节约计算资源)
  // 如果相机的一些属性发生了变化，需要执行updateProjectionMatrix ()方法更新相机的投影矩阵
  camera.updateProjectionMatrix();
};

/**
 * 描述：开启全局window的窗口改动事件监听
 * @return
 */
export const injectWindowResize = () => {
  window.addEventListener("resize", handleViewUpdate);
};

/**
 * 描述：移除对window对象窗口变动handleViewUpdate事件的触发
 * @return
 */
export const removeWindowResize = () => {
  window.removeEventListener("resize", handleViewUpdate);
};

/**
 * 描述：控制自转开关的打开模式，这里将修改暴露，能够让具体的逻辑再外部实现
 * @return void
 */
export const injectGroupSelfRotation = () => {
  selfRotationFlag = true;
};

/**
 * 描述：控制自转开关的关闭模式，这里将修改暴露，能够让具体的逻辑再外部实现
 * @return void
 */
export const removeGroupSelfRotation = () => {
  selfRotationFlag = false;
};

/**
 * 描述：初始化标签
 * @param {  }
 * @return
 */
const initLabel = (container: HTMLCanvasElement) => {
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight); //和渲染器保持一个大小
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0";
  labelRenderer.domElement.style.zIndex = "1000";
  labelRenderer.domElement.style.pointerEvents = "none";
  labelRenderer.domElement.className = "label-icon";
  container.appendChild(labelRenderer.domElement);
};

// /**
//  * 添加标签：dom方式
//  * @param {*} targePosition ：需要传递当前标签的位置
//  * @param {*} targetId ：标签对应的dom的唯一ID，暂且用时间戳代替，避免重复
//  * @param {*} innerHTML ：标签对应html
//  */
// export function labelTag(positionwebGLdom: HTMLElement | null) {
//   if (!webGLdom) return;
//   const { width, height } = webGLdom.getBoundingClientRect();
//   const worldVector = new THREE.Vector3(0, 0, 0);
//   const vector = worldVector.project(camera);
//   const halfWidth = width / 2,
//     halfHeight = height / 2;
//   const x = Math.round(vector.x * halfWidth + halfWidth);
//   const y = Math.round(-vector.y * halfHeight + halfHeight);
//   /**
//    * 更新立方体元素位置
//    */
//   const div = document.createElement("div");
//   div.style.left = x + "px";
//   div.style.top = y + "px";
//   div.style.position = "absolute";
//   div.innerHTML = `uuid:1111`;
//   webGLdom.appendChild(div);
// }

/**
 * 描述：将坐标转换为3D模型内部坐标
 * @param {  }
 * @return
 */
export const convertPosition = (id: string) => {
  // let vector = new Vector3();
  // console.log("renderer", renderer, renderer.getContext());
  // const widthHalf = 0.5 * renderer.getContext().canvas.width;
  // const heightHalf = 0.5 * renderer.getContext().canvas.height;
  // //get 3d object position
  // // object.updateMatrixWorld();
  // console.log("world-position", object.getWorldPosition(vector));
  // vector = vector.setFromMatrixPosition(object.matrixWorld);
  // //translate to top （assume that position in the middle of the mesh）
  // vector.project(camera);
  // //get 2d position on screen
  // vector.x = Math.round(vector.x * widthHalf + widthHalf);
  // vector.y = Math.round(-(vector.y * heightHalf) + heightHalf);
  // return {
  //   x: vector.x,
  //   y: vector.y,
  // };
};
/*
 * 描述：mesh坐标数据结构
 */
export interface IMeshPosition {
  /*
   * 描述：x轴坐标
   */
  x: number;
  /*
   * 描述：y轴坐标
   */
  y: number;
  /*
   * 描述：z轴坐标
   */
  z: number;
}
/*
 * 描述：收集所有Mesh对应的坐标，方便后续给不同位置添加标注
 * 其他说明：
 */
const meshPositionMap = new Map<string, IMeshPosition>();
/**
 * 描述：获取所有部件的3维坐标，方便后续根据uuid获取
 * @param { Group } group 模型组
 * @return void
 */
const setAllMeshPosition = (group: typeof Group) => {
  group.traverse(function (obj3d: typeof Object3D) {
    console.log("obj3");
    if (obj3d.type === "Mesh") {
      const pos = new THREE.Vector3();
      const position: IMeshPosition = obj3d.getWorldPosition(pos); //获取obj世界坐标
      console.log("object3d", obj3d, position);
      meshPositionMap.set(obj3d.name, position);
      // if (obj3d.userData.ElementID) {
      //   meshPositionMap.set(obj3d.name, position);
      // }
    }
  });
};

/**
 * 描述：获取所有的id和坐标关联数据
 * @return meshPositionMap
 */
export const getAllMeshPosition = () => {
  return meshPositionMap;
};
