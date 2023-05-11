import { SelectionBox } from "three/examples/jsm/interactive/SelectionBox.js";
import { SelectionHelper } from "three/examples/jsm/interactive/SelectionHelper.js";
import { camera, controls, renderer, scene } from "./core";
let selectionBox: SelectionBox;
let helper: SelectionHelper;
/**
 * 描述：初始化框选
 * @param {  }
 * @return
 */
export const initSelectionBox = () => {
  selectionBox = new SelectionBox(camera, scene);
};
const initSelectionBoxHelper = () => {
  helper = new SelectionHelper(renderer, "selectBox");
};
/**
 * 描述：开启框选功能
 * @param {  }
 * @return
 */
export const startSelectionBox = () => {
  initSelectionBoxHelper();
  // closeControlsRotate();
  // selectionBox = new SelectionBox(camera, scene);
  // helper = new SelectionHelper(renderer, "selectBox");
  if (controls) controls.enableRotate = false;
  document.addEventListener("pointerdown", pointerDownEvent);
  document.addEventListener("pointermove", pointerMoveEvent);
  document.addEventListener("pointerup", pointerUpEvent);
};
const pointerDownEvent = (event: PointerEvent) => {
  if (event.button !== 0) {
    helper.isDown = false;
    return;
  } else {
    helper.isDown = true;
  }
  clearSelectionBoxCollection();

  selectionBox.startPoint.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5
  );
};
const pointerMoveEvent = (event: PointerEvent) => {
  if (helper.isDown) {
    // 这里也有清空逻辑todo(并不是很理解)
    clearSelectionBoxCollection();

    selectionBox.endPoint.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      0.5
    );

    const allSelected = selectionBox.select();

    for (let i = 0; i < allSelected.length; i++) {
      const material = (allSelected[i].material as any).clone();
      if (!material.emissive) continue;
      // console.log("move-selected", material);
      material.emissive.set(0x00ff00);
      allSelected[i].material = material;
    }
  }
};
const pointerUpEvent = (event: PointerEvent) => {
  if (event.button !== 0) return;
  selectionBox.endPoint.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5
  );

  const allSelected = selectionBox.select();

  for (let i = 0; i < allSelected.length; i++) {
    const material = (allSelected[i].material as any).clone(); //这里同样需要收集信息传递给后端
    if (!material.emissive) continue;
    material.emissive.set(0x00ff00);
    allSelected[i].material = material;
  }
  console.log("allSelected", allSelected);
};
export const endSelectionBox = () => {
  helper.dispose();
  // selectionBox.dispose();
  document.removeEventListener("pointerdown", pointerDownEvent);
  document.removeEventListener("pointermove", pointerMoveEvent);
  document.removeEventListener("pointerup", pointerUpEvent);
  // 清空已经改了颜色的 ->
  clearSelectionBoxCollection();
  if (controls) controls.enableRotate = true;
};

const clearSelectionBoxCollection = () => {
  for (const item of selectionBox.collection) {
    const material = (item.material as any).clone();
    if (!material.emissive) continue;
    material.emissive.set(0x000000);
    item.material = material;
  }
  selectionBox.collection.length = 0;
};
