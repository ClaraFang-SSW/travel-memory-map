import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class NebulaEngine {
    constructor() {
        this.init();
        this.createBackgroundStars();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85));

        this.camera.position.z = 5;
        this.animate();
    }

    // 初始的分散粒子
    createBackgroundStars() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(5000 * 3);
        for(let i=0; i<15000; i++) pos[i] = (Math.random() - 0.5) * 20;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.bgStars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x444444, size: 0.015 }));
        this.scene.add(this.bgStars);
    }

    async generatePointCloud(url) {
        // 移除初始背景，形成图片粒子
        if(this.bgStars) this.scene.remove(this.bgStars);
        if(this.nebula) this.scene.remove(this.nebula);

        const tex = await new THREE.TextureLoader().loadAsync(url);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tex.image, 0, 0, 160, 160);
        const data = ctx.getImageData(0, 0, 160, 160).data;

        const pos = [], cols = [], orig = [];
        for(let i=0; i<data.length; i+=4) {
            const x = (i/4 % 160), y = Math.floor(i/4 / 160);
            const dist = Math.sqrt(Math.pow(x-80,2) + Math.pow(y-80,2));
            if(data[i+3] > 50 && dist < 78) {
                const px = (x/160 - 0.5) * 7, py = (0.5 - y/160) * 7;
                const lum = (data[i]*0.29 + data[i+1]*0.58 + data[i+2]*0.11)/255;
                const pz = lum * 2.5; // 亮度起伏
                pos.push(px, py, pz); orig.push(px, py, pz);
                cols.push(data[i]/255, data[i+1]/255, data[i+2]/255);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        this.nebula = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.012, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true }));
        this.nebula.userData.orig = orig;
        this.scene.add(this.nebula);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001;
        if(this.bgStars) {
            this.bgStars.rotation.y += 0.0005;
        }
        if(this.nebula) {
            const attr = this.nebula.geometry.attributes.position;
            const orig = this.nebula.userData.orig;
            for(let i=0; i<attr.count; i++) {
                // 布朗运动微颤
                attr.array[i*3] += (Math.random()-0.5) * 0.008;
                attr.array[i*3+1] += (Math.random()-0.5) * 0.008;
            }
            attr.needsUpdate = true;
            this.nebula.rotation.y = Math.sin(time * 0.2) * 0.1;
        }
        this.composer.render();
    }
