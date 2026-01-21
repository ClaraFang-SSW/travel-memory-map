import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class NebulaEngine {
    constructor() {
        // 预留的艺术控制接口
        this.config = {
            pointSize: 0.01,
            density: 180,
            displacement: 2.5,  // 亮度起伏强度
            brownian: 0.008,    // 粒子颤动强度
            nebulaScale: 6      // 星云缩放
        };
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.7, 0.1);
        this.composer.addPass(bloom);

        this.camera.position.z = 4.5;
        this.animate();
    }

    async generatePointCloud(url) {
        if(this.points) this.scene.remove(this.points);
        const tex = await new THREE.TextureLoader().loadAsync(url);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.config.density;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tex.image, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        const pos = [], cols = [], orig = [];
        for(let i=0; i<data.length; i+=4) {
            const x = (i/4 % canvas.width), y = Math.floor(i/4 / canvas.width);
            const dist = Math.sqrt(Math.pow(x-canvas.width/2, 2) + Math.pow(y-canvas.height/2, 2));
            if(data[i+3] > 50 && dist < canvas.width * 0.46) {
                const px = (x/canvas.width - 0.5) * this.config.nebulaScale;
                const py = (0.5 - y/canvas.height) * this.config.nebulaScale;
                const lum = (data[i]*0.29 + data[i+1]*0.58 + data[i+2]*0.11)/255;
                const pz = lum * this.config.displacement;
                pos.push(px, py, pz); orig.push(px, py, pz);
                cols.push(data[i]/255, data[i+1]/255, data[i+2]/255);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        this.points = new THREE.Points(geo, new THREE.PointsMaterial({ 
            size: this.config.pointSize, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9 
        }));
        this.points.userData.orig = orig;
        this.scene.add(this.points);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if(this.points) {
            const attr = this.points.geometry.attributes.position;
            const orig = this.points.userData.orig;
            for(let i=0; i<attr.count; i++) {
                attr.array[i*3] += (Math.random()-0.5) * this.config.brownian;
                attr.array[i*3+1] += (Math.random()-0.5) * this.config.brownian;
            }
            attr.needsUpdate = true;
            this.points.rotation.y += 0.001;
        }
        this.composer.render();
    }
}
