import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class NebulaEngine {
    constructor() {
        this.config = { 
            pointSize: 0.007, density: 350, displacement: 1.0, 
            brownian: 0.005, nebulaSize: 8, breatheSpeed: 0.8,
            breatheWave: 0.1, edgeRadius: 0.4, edgeBlur: 0.1 
        };
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
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer.addPass(this.bloomPass);

        this.camera.position.z = 5;
        this.animate();
    }

    createBackgroundStars() {
        // ... (保持之前背景星空代码不变)
    }

    async generatePointCloud(url) {
        if(this.bgStars) this.scene.remove(this.bgStars);
        if(this.nebula) this.scene.remove(this.nebula);

        const tex = await new THREE.TextureLoader().loadAsync(url);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.config.density;
        const ctx = canvas.getContext('2d');
        const scale = Math.min(canvas.width / tex.image.width, canvas.height / tex.image.height);
        ctx.drawImage(tex.image, (canvas.width - tex.image.width * scale)/2, (canvas.height - tex.image.height * scale)/2, tex.image.width * scale, tex.image.height * scale);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pos = [], cols = [], orig = [];
        const center = canvas.width / 2;

        for(let i=0; i<data.length; i+=4) {
            const ix = (i/4 % canvas.width);
            const iy = Math.floor(i/4 / canvas.width);
            const dist = Math.sqrt(Math.pow(ix - center, 2) + Math.pow(iy - center, 2)) / canvas.width;

            // 核心算法：基于 Edge Radius 和 Edge Blur 的圆形剪裁与发散
            if(data[i+3] > 80 && dist < this.config.edgeRadius + this.config.edgeBlur) {
                const px = (ix/canvas.width - 0.5) * this.config.nebulaSize;
                const py = (0.5 - iy/canvas.height) * this.config.nebulaSize;
                const lum = (data[i]*0.29 + data[i+1]*0.58 + data[i+2]*0.11)/255;
                const pz = lum * this.config.displacement;
                
                pos.push(px, py, pz); orig.push(px, py, pz);
                cols.push(data[i]/255, data[i+1]/255, data[i+2]/255);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        this.nebula = new THREE.Points(geo, new THREE.PointsMaterial({ size: this.config.pointSize, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true }));
        this.nebula.userData.orig = orig;
        this.scene.add(this.nebula);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001 * this.config.breatheSpeed;
        if(this.bgStars) this.bgStars.rotation.y += 0.0001;
        if(this.nebula) {
            const attr = this.nebula.geometry.attributes.position;
            const orig = this.nebula.userData.orig;
            for(let i=0; i<attr.count; i++) {
                attr.array[i*3] = orig[i*3] + (Math.random()-0.5) * this.config.brownian;
                attr.array[i*3+1] = orig[i*3+1] + (Math.random()-0.5) * this.config.brownian;
                // 实时更新呼吸感
                attr.array[i*3+2] = orig[i*3+2] + Math.sin(time + orig[i*3] * 0.5) * this.config.breatheWave;
            }
            attr.needsUpdate = true;
            this.nebula.material.size = this.config.pointSize;
        }
        this.composer.render();
    }
}
