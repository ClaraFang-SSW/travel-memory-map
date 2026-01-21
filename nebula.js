import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class NebulaEngine {
    constructor() {
        this.config = { 
            pointSize: 0.006, density: 400, displacement: 0.8, 
            brownian: 0.004, nebulaSize: 8.5, breatheSpeed: 0.6,
            breatheWave: 0.12, edgeRadius: 0.35, edgeBlur: 0.4,
            focus: 3.2 
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
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.4, 0.4, 0.85);
        this.composer.addPass(this.bloomPass);

        this.camera.position.z = 5;
        this.animate();
    }

    createBackgroundStars() {
        const count = 8000;
        const pos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);
        for(let i=0; i<count; i++) {
            pos[i*3] = (Math.random() - 0.5) * 40;
            pos[i*3+1] = (Math.random() - 0.5) * 40;
            pos[i*3+2] = (Math.random() - 0.5) * 20 - 10;
            cols[i*3] = 0.15; cols[i*3+1] = 0.18; cols[i*3+2] = 0.25;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        this.bgStars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.008, vertexColors: true, transparent: true, opacity: 0.3 }));
        this.scene.add(this.bgStars);
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

        const data = ctx
