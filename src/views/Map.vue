<script setup lang="ts">
import MapCityToolTip from "@/components/MapCityToolTip.vue";

import { onMounted, onUnmounted, ref, type Ref, createApp } from "vue";

import * as THREE from "three";
import * as d3 from "d3";
import TWEEN from "@tweenjs/tween.js";

import axios from "axios";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/Addons.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/Addons.js";

import * as cnGeoJson from "@/data/maps/cn.geo.json";
import * as gdGeoJson from "@/data/maps/gd.geo.json";

const threeMapDiv: Ref<HTMLElement | null> = ref(null);
const cityNameLabelDiv: Ref<HTMLElement | null> = ref(null);

const gdCityWeathers: Ref<{ [key: string]: { temperature: number; humidity: number; weatherDescription: string; reportTime: string } }> = ref({});

async function fetchGdData() {
	const API_PREFIX = "/api";

	await axios
		.get("/gd", { baseURL: API_PREFIX })
		.then(response => response.data)
		.then(data => {
			for (let key in data) {
				let info = data[key].lives[0];
				let cityName = info.city;
				let weatherFeatures = {
					temperature: info.temperature,
					humidity: info.humidity,
					weatherDescription: info.weather,
					reportTime: info.reporttime,
				};
				gdCityWeathers.value[cityName] = weatherFeatures;
			}
		})
		.catch(error => {
			console.error("Fetch GD Data Error: ", error);
		});
}

// 数据预处理
let cnGeo: GeoJSON.FeatureCollection = {
	...(cnGeoJson as GeoJSON.FeatureCollection),
	features: (cnGeoJson as GeoJSON.FeatureCollection).features.filter(feature => feature.properties?.name != "广东省"),
};
let gdGeo = gdGeoJson as GeoJSON.FeatureCollection;

class ThreeMap {
	// 成员变量
	canvasWidth: number;
	canvasHeight: number;
	renderWidth: number;
	renderHeight: number;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	controller: OrbitControls;
	raycaster: THREE.Raycaster;
	mouse: THREE.Vector2 | undefined = undefined;
	lastPick: THREE.Object3D | null = null;
	cnMap: THREE.Object3D<THREE.Object3DEventMap>;
	gdMap: THREE.Object3D<THREE.Object3DEventMap>;
	gdCityMeshes: THREE.Object3D[];
	cityNameLabels: THREE.Group = new THREE.Group();

	cnMapMaterial: THREE.MeshBasicMaterial[];
	gdMapMaterial: THREE.MeshBasicMaterial[];
	lineMaterial: THREE.LineBasicMaterial;
	gdLineMaterial: THREE.LineBasicMaterial;
	cnMapHeight: number;
	gdMapHeight: number;
	cnCenterTargetPos: THREE.Vector3;
	provinceTargetPos: THREE.Vector3;

	// labelRenderer: CSS2DRenderer;
	controllerConfig: {
		target: THREE.Vector3;
		enableDamping: boolean;
		dampingFactor: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
		minPolarAngle: number;
		maxPolarAngle: number;
		zoomSpeed: number;
	};
	controller2: OrbitControls | undefined;
	projectionFn: Function;
	scene2: THREE.Scene;
	renderCSS3D: CSS3DRenderer;

	constructor(divElement: HTMLElement, cityLabelDivElement: HTMLElement, width: number, height: number) {
		// 新建场景
		this.canvasWidth = width;
		this.canvasHeight = height;
		let deviceDpr = window.devicePixelRatio;
		this.renderWidth = this.canvasWidth * deviceDpr;
		this.renderHeight = this.canvasHeight * deviceDpr;

		// 初始化参数
		this.cnMapMaterial = [
			new THREE.MeshBasicMaterial({
				color: "#006E1C",
				transparent: true,
				opacity: 0.8,
			}),
			new THREE.MeshBasicMaterial({
				color: "#005313",
				transparent: true,
				opacity: 0.3,
			}),
		];
		this.gdMapMaterial = [
			new THREE.MeshBasicMaterial({
				color: "#006E1C", // 深绿色
				// color: "#6F8B70", // 浅绿色
				transparent: true,
				opacity: 0.8,
			}),
			new THREE.MeshBasicMaterial({
				color: "#005313",
				transparent: true,
				opacity: 0.3,
			}),
		];
		this.lineMaterial = new THREE.LineBasicMaterial({
			color: "#FCFDF6",
			transparent: true,
			opacity: 0.8,
		});
		this.gdLineMaterial = new THREE.LineBasicMaterial({
			color: "#FCFDF6",
			transparent: true,
			opacity: 0,
		});
		this.projectionFn = d3.geoMercator().center([100.82, 38.05]).translate([0, 0]);

		this.cnCenterTargetPos = new THREE.Vector3(8.039, 6.65, 1);
		this.provinceTargetPos = new THREE.Vector3(33, -46, 1);

		// 新建场景
		this.scene = new THREE.Scene();

		// 新建相机
		this.camera = new THREE.PerspectiveCamera(75, this.canvasWidth / this.canvasHeight, 0.1, 3000);
		this.camera.position.z = 250;

		// 设置渲染器
		// CSS3DRenderer
		this.scene2 = new THREE.Scene();
		this.renderCSS3D = new CSS3DRenderer();
		this.renderCSS3D.setSize(this.canvasWidth, this.canvasHeight);
		this.renderCSS3D.domElement.style.position = "absolute";
		this.renderCSS3D.domElement.style.top = "0";
		cityLabelDivElement.appendChild(this.renderCSS3D.domElement);

		// this.labelRenderer = new CSS2DRenderer();
		// this.labelRenderer.setSize(this.canvasWidth, this.canvasHeight);
		// this.labelRenderer.domElement.style.position = "absolute";
		// this.labelRenderer.domElement.style.top = "0";
		// this.labelRenderer.domElement.style.pointerEvents = "none";
		// cityLabelDivElement.appendChild(this.labelRenderer.domElement);

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			logarithmicDepthBuffer: true,
		});
		this.renderer.setSize(this.canvasWidth, this.canvasHeight);
		this.renderer.setPixelRatio(deviceDpr);
		divElement.appendChild(this.renderer.domElement);

		// this.renderCSS3D.domElement.appendChild(this.renderer.domElement);

		// 设置控制器
		this.controllerConfig = {
			target: new THREE.Vector3(this.cnCenterTargetPos.x, this.cnCenterTargetPos.y, this.cnCenterTargetPos.z),
			enableDamping: true,
			dampingFactor: 0.12,
			minAzimuthAngle: 0,
			maxAzimuthAngle: 0,
			minPolarAngle: Math.PI / 2,
			maxPolarAngle: Math.PI,
			zoomSpeed: 1.5,
		};
		this.controller = new OrbitControls(this.camera, this.renderer.domElement);
		this.controller.target.copy(this.controllerConfig.target);
		this.controller.enableDamping = this.controllerConfig.enableDamping;
		this.controller.dampingFactor = this.controllerConfig.dampingFactor;
		this.controller.minAzimuthAngle = this.controllerConfig.minAzimuthAngle;
		this.controller.maxAzimuthAngle = this.controllerConfig.maxAzimuthAngle;
		this.controller.minPolarAngle = this.controllerConfig.minPolarAngle;
		this.controller.maxPolarAngle = this.controllerConfig.maxPolarAngle;
		this.controller.zoomSpeed = this.controllerConfig.zoomSpeed;
		// CSS3D控制器
		// this.controller2 = new OrbitControls(this.camera, this.renderCSS3D.domElement);
		// this.controller2.target.copy(this.controllerConfig.target);
		// this.controller2.enableDamping = this.controllerConfig.enableDamping;
		// this.controller2.dampingFactor = this.controllerConfig.dampingFactor;
		// this.controller2.minAzimuthAngle = this.controllerConfig.minAzimuthAngle;
		// this.controller2.maxAzimuthAngle = this.controllerConfig.maxAzimuthAngle;
		// this.controller2.minPolarAngle = this.controllerConfig.minPolarAngle;
		// this.controller2.maxPolarAngle = this.controllerConfig.maxPolarAngle;
		// this.controller2.zoomSpeed = this.controllerConfig.zoomSpeed;

		// 生成地图
		this.cnMapHeight = 0.4;
		this.gdMapHeight = 1.2;
		this.cnMap = this.generateMap(cnGeo, this.cnMapHeight, this.cnMapMaterial, this.lineMaterial);
		this.gdMap = this.generateMap(gdGeo, this.gdMapHeight, this.gdMapMaterial, this.gdLineMaterial, true);
		this.gdMap.position.z = this.cnMapHeight - this.gdMapHeight;
		this.gdCityMeshes = [];
		this.gdMap.children.forEach(city => {
			city.children.forEach(object => {
				if (object.type == "Mesh") this.gdCityMeshes.push(object);
			});
		});

		// 生成城市名称标签
		// this.cityNameLabels = this.generateCityNameLabel(this.gdMap, gdGeo);

		// 测试Tooltip
		// let gzPos = this.projectionFn([113.544372, 23.329249]);
		// console.log("广州市坐标: ", gzPos);
		// let labelPos = new THREE.Vector3(gzPos[0] + 1, -gzPos[1] - 0.5, this.gdMapHeight + 3);
		// console.log("Label Position: ", labelPos);
		// this.createCSSLabel(
		// 	"广州市",
		// 	[
		// 		{ key: "气温", value: "31.98℃" },
		// 		{ key: "湿度", value: "12%" },
		// 		{ key: "回南天", value: "低概率" },
		// 	],
		// 	labelPos
		// );

		// 设置光线
		this.raycaster = new THREE.Raycaster();
		const onMouseMove = (event: MouseEvent) => {
			this.mouse = new THREE.Vector2((event.offsetX / this.canvasWidth) * 2 - 1, -(event.offsetY / this.canvasHeight) * 2 + 1);

			// console.log("Mouse: ", this.mouse);
		};
		threeMapDiv.value?.addEventListener("mousemove", onMouseMove, false);

		this.zoomInAnimation();
	}

	render() {
		this.renderer.render(this.scene, this.camera);
		this.renderCSS3D.render(this.scene2, this.camera);
		// this.labelRenderer.render(this.scene, this.camera);
	}

	generateMapFromPolygon(
		coordinates: GeoJSON.Position[],
		mapUnit: THREE.Object3D,
		height: number,
		meshMaterial: THREE.Material[],
		lineMaterial: THREE.Material
	) {
		let mapProjection = this.projectionFn;
		const shape = new THREE.Shape();

		const lineGeometry = new THREE.BufferGeometry();
		const points: Array<THREE.Vector3> = [];

		coordinates.forEach((coodinate: any, index: any) => {
			const result = mapProjection(coodinate);
			if (!result) {
				console.error("Unexpected result from projection: ", result);
			} else {
				const [x, y] = result;
				if (index == 0) {
					shape.moveTo(x, -y);
				}
				shape.lineTo(x, -y);

				points.push(new THREE.Vector3(x, -y, height + 0.1));
			}
		});
		lineGeometry.setFromPoints(points);

		const extrudeSettings = {
			depth: height,
			bevelEnabled: false,
		};

		const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

		const mesh = new THREE.Mesh(geometry, meshMaterial);
		mesh.name = mapUnit.name;
		// mesh.renderOrder = 10;
		const line = new THREE.Line(lineGeometry, lineMaterial);
		// line.renderOrder = 0;

		mapUnit.add(mesh);
		mapUnit.add(line);
	}

	generateMap(
		geoData: GeoJSON.FeatureCollection,
		height: number = 1,
		meshMaterial: THREE.MeshBasicMaterial[] = this.cnMapMaterial,
		lineMaterial: THREE.Material = this.lineMaterial,
		isGdMap: boolean = false
	) {
		// 生成地图的几何体
		let map = new THREE.Object3D();

		geoData.features.forEach(feature => {
			const parentObject = new THREE.Object3D();

			let cityName = feature.properties?.name;
			parentObject.name = cityName;

			let thisMeshMaterial: THREE.MeshBasicMaterial[] = meshMaterial;

			let weatherInfo = gdCityWeathers.value[cityName];
			if (isGdMap && gdCityWeathers && weatherInfo) {
				// console.log("Weather Info: ", weatherInfo);
				let h = Math.pow(weatherInfo.humidity / 100, 10);
				let c2 = new THREE.Color("#A2D7F6");

				let newMeshMaterial = meshMaterial[0].clone();
				newMeshMaterial.color.lerp(c2, h);
				// console.log("New Mesh Material: ", newMeshMaterial.color.getHexString());

				thisMeshMaterial = [newMeshMaterial, meshMaterial[1]];

				// console.log(meshMaterial);
			}

			if (feature.geometry.type === "Polygon") {
				const coordinates = feature.geometry.coordinates as GeoJSON.Position[][];
				coordinates.forEach((polygon: GeoJSON.Position[]) => {
					this.generateMapFromPolygon(polygon, parentObject, height, thisMeshMaterial, lineMaterial);
				});
			} else if (feature.geometry.type === "MultiPolygon") {
				const coordinates = feature.geometry.coordinates as GeoJSON.Position[][][];

				coordinates.forEach((multiPolygon: GeoJSON.Position[][]) => {
					multiPolygon.forEach((polygon: any) => {
						this.generateMapFromPolygon(polygon, parentObject, height, thisMeshMaterial, lineMaterial);
					});
				});
			} else {
				console.error("意外的Feature Geometry Type: ", feature.geometry.type);
				// return undefined;
			}

			map.add(parentObject);
			// console.log(feature.properties?.name, province);
		});
		this.scene.add(map);
		// console.log("Map: ", map);
		return map;
	}

	generateCityNameLabel(map: THREE.Object3D<THREE.Object3DEventMap>, mapUnitGeo: GeoJSON.FeatureCollection) {
		let mapProjection = this.projectionFn;

		let spriteGroup = new THREE.Group();

		map.children.forEach(city => {
			let canvas = document.createElement("canvas");
			canvas.width = 48;
			canvas.height = 24;
			let ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.fillStyle = "#FCFDF6";
				ctx.font = "24px Roboto";
				ctx.fillText(city.name.replace("市", ""), 0, 20);

				let texture = new THREE.Texture(canvas);
				texture.needsUpdate = true;
				let material = new THREE.SpriteMaterial({
					map: texture,
					// sizeAttenuation: false,
					opacity: 0,
				});

				let sprite = new THREE.Sprite(material);
				let scale = 0.07 * 20;
				sprite.scale.set(scale, scale / 2, 1);

				let cityCenter = mapUnitGeo.features.find(feature => feature.properties?.name == city.name)?.properties?.centroid;
				let cityCenterPos = mapProjection(cityCenter);

				if (!cityCenterPos) {
					console.error("[generateCityNameLabel]Unexpected result from projection: ", cityCenterPos);
				} else {
					sprite.position.set(cityCenterPos[0], -cityCenterPos[1], this.gdMapHeight + 0.3);
					spriteGroup.add(sprite);
				}
			} else {
				console.error("Canvas 2D Context is null");
			}
		});

		this.scene.add(spriteGroup);
		return spriteGroup;
	}

	rayCastUpdate() {
		// let castMeterial = new THREE.MeshBasicMaterial({ color: "#005313", transparent: true, opacity: 0.8 });

		if (!this.mouse) return;

		this.raycaster.setFromCamera(this.mouse, this.camera);
		const intersects = this.raycaster.intersectObjects(this.gdCityMeshes, true);

		if (this.lastPick) {
			this.lastPick.children
				.filter(obj => obj.type == "Mesh")
				.forEach(obj => {
					((obj as THREE.Mesh).material as THREE.MeshBasicMaterial[])[0].opacity = this.gdMapMaterial[0].opacity;
				});
		}

		this.lastPick = intersects[0] ? intersects[0].object.parent : null;
		// if (this.lastPick) console.log(this.lastPick);
		if (this.lastPick) {
			this.lastPick.children.forEach(object => {
				if (object.type === "Mesh") {
					((object as THREE.Mesh).material as THREE.MeshBasicMaterial[])[0].opacity = 1;
				}
			});
		}
	}

	createCSSLabel(title: string, content: any, position: THREE.Vector3) {
		let labelDiv = document.createElement("div");

		const tooltip = createApp(MapCityToolTip, { title, params: content }).mount(labelDiv);

		// let label = new CSS2DObject(labelDiv);
		let label = new CSS3DObject(labelDiv);

		label.position.copy(position);

		label.rotateX(Math.PI / 4);
		label.rotateY(-Math.PI / 15);
		// label.rotateZ(Math.PI / 15);
		label.scale.set(0.05, 0.05, 0.05);

		// this.scene.add(label);
		this.scene2.add(label);
		// this.gdMap.add(label);

		return label;
	}

	animate() {
		requestAnimationFrame(this.animate.bind(this));
		this.rayCastUpdate();

		TWEEN.update();

		if (this.controller2) this.controller2.update();
		if (this.controller) this.controller.update();
		this.render();
	}

	zoomInAnimation() {
		let ease1 = {
			x: this.camera.position.x,
			y: this.camera.position.y,
			z: this.camera.position.z,
			cnMapOpacity: this.cnMapMaterial[0].opacity,
			orbitCenter: {
				x: this.controllerConfig.target.x,
				y: this.controllerConfig.target.y,
				z: this.controllerConfig.target.z,
			},
		};
		let ease2 = {
			z: this.cnMapHeight - this.gdMapHeight,
		};
		let ease3 = {
			gdLineOpacity: this.gdLineMaterial.opacity,
			cityNameLabelOpacity: -1,
		};
		let tween = new TWEEN.Tween(ease1);
		let tween2 = new TWEEN.Tween(ease2);
		let tween3 = new TWEEN.Tween(ease3);

		tween.to(
			{
				x: 33,
				y: -65,
				z: 25,
				cnMapOpacity: 0.1,
				orbitCenter: {
					x: this.provinceTargetPos.x,
					y: this.provinceTargetPos.y,
					z: this.provinceTargetPos.z,
				},
				gdLineOpacity: 0.8,
			},
			// 4000
			500
		);
		tween2.to(
			{
				z: 0,
			},
			1500
		);
		tween3.to(
			{
				gdLineOpacity: 0.8,
				cityNameLabelOpacity: 0.8,
			},
			5000
		);

		// tween.delay(500);
		tween.easing(TWEEN.Easing.Quartic.InOut);
		tween.start();

		// tween2.delay(3000);
		tween2.easing(TWEEN.Easing.Quartic.Out);
		tween2.start();

		// tween3.delay(3000);
		tween3.easing(TWEEN.Easing.Quartic.Out);
		tween3.start();

		tween.onUpdate(() => {
			this.camera.position.set(ease1.x, ease1.y, ease1.z);
			this.controller.target.set(ease1.orbitCenter.x, ease1.orbitCenter.y, ease1.orbitCenter.z);
			this.controller2?.target.set(ease1.orbitCenter.x, ease1.orbitCenter.y, ease1.orbitCenter.z);

			this.cnMapMaterial[0].opacity = ease1.cnMapOpacity;
		});

		tween2.onUpdate(() => {
			this.gdMap.position.z = ease2.z;
			// console.log(this.gdLineMaterial.opacity);
		});

		tween3.onUpdate(() => {
			this.gdLineMaterial.opacity = ease3.gdLineOpacity;
			this.cityNameLabels.children.forEach(sprite => {
				(sprite as THREE.Sprite).material.opacity = Math.max(0, ease3.cityNameLabelOpacity);
			});
		});
	}
}

let threeMap: ThreeMap | undefined = undefined;

onMounted(() => {
	let widthNum = parseFloat(window.getComputedStyle(threeMapDiv.value!).width.replace("px", ""));
	let heightNum = parseFloat(window.getComputedStyle(threeMapDiv.value!).height.replace("px", ""));

	fetchGdData().finally(() => {
		threeMap = new ThreeMap(threeMapDiv.value!, cityNameLabelDiv.value!, widthNum, heightNum);
		threeMap.animate();
	});
});

onUnmounted(() => {
	if (threeMap) {
		threeMap = undefined;
	}
});
</script>

<template>
	<div class="root" id="map-root">
		<div class="map-div" id="three-map-div" ref="threeMapDiv"></div>
		<div class="name-label-div" id="city-name-label-div" ref="cityNameLabelDiv"></div>
	</div>
</template>

<style scoped>
.root {
	position: absolute;
	left: 0;
	right: 0;
	/* width: 100%; */
	height: calc(100vh - 9rem);
}

.map-div,
.name-label-div {
	position: absolute;
	width: 100%;
	height: 100%;
}

#city-name-label-div {
	pointer-events: none;
}
</style>

<style lang="scss">
div.tooltip-content {
	padding: 0 0.4rem;

	div.tooltip-title {
		text-align: center;
		margin-bottom: 0.2rem;
	}

	div.tooltip-line {
		height: 1.4rem;
		span {
			display: inline-block;
			margin-bottom: 0;
		}

		span.line-subtitle {
			width: 5rem;
			text-align: left;
		}

		span.line-value {
			width: 3rem;
			text-align: right;
			font-weight: bold;
		}
	}
}
</style>
