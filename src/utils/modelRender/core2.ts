// 主要包含初始化的一些属性

import { Vector3, Texture, Color, CubeTexture } from "three";

// 相机参数？相机定位？渲染容器？场景背景颜色？是否开启环境贴图？
export interface ICoreConfig {
  container: HTMLElement | null;
  cameraPosition?: typeof Vector3;
  cameraFov?: number;
  cameraAspect?: number;
  cameraNear?: number;
  cameraFar?: number;
  sceneBackgroundColor:
    | typeof Color
    | typeof Texture
    | typeof CubeTexture
    | null;
}
class ViewerCore {
  private coreConfig: ICoreConfig = {
    container: null,
    cameraPosition: new Vector3(0, 0, 0),
    cameraFov: 50,
    cameraNear: 0.1,
    cameraFar: 2000,
    cameraAspect: 1,
    sceneBackgroundColor: null,
  };
  constructor(config: ICoreConfig) {
    this.coreConfig = Object.assign(this.coreConfig, config);
  }
}
