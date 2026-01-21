import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class NebulaEngine {
    constructor() {
        this.config = { pointSize: 0.012, density: 160, displacement: 2.2, brownian: 0.006 };
        this.init();
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

        this.camera.position.z = 4.5;
        this.animate();
    }

    async generatePointCloud(url) {
        if(this.points) this.scene.remove(this.points);
        const tex = await new THREE.TextureLoader().loadAsync(url);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.config.density;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tex.image, 0, 0, 160, 160);
        const data = ctx.getImageData(0, 0, 160, 160).data;

        const pos = [], cols = [], orig = [];
        for(let i=0; i<data.length; i+=4) {
            const x = (i/4 % 160), y = Math.floor(i/4 / 160);
            const dist = Math.sqrt(Math.pow(x-80,2) + Math.pow(y-80,2));
            if(data[i+3] > 50 && dist < 75) {
                const px = (x/160 - 0.5) * 6, py = (0.5 - y/160) * 6;
                const lum = (data[i]*0.29 + data[i+1]*0.58 + data[i+2]*0.11)/255;
                const pz = lum * this.config.displacement;
                pos.push(px, py, pz); orig.push(px, py, pz);
                cols.push(data[i]/255, data[i+1]/255, data[i+2]/255);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        this.points = new THREE.Points(geo, new THREE.PointsMaterial({ size: this.config.pointSize, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true }));
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
            this.points.rotation.y += 0.002;
        }
        this.composer.render();
    }
}
