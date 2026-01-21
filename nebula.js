import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class NebulaEngine {
    constructor() {
        this.config = { pointSize: 0.007, density: 350, displacement: 1.0, brownian: 0.005 };
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

    createBackgroundStars() {
        const count = 8000;
        const pos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);
        for(let i=0; i<count; i++) {
            pos[i*3] = (Math.random() - 0.5) * 40;
            pos[i*3+1] = (Math.random() - 0.5) * 40;
            pos[i*3+2] = (Math.random() - 0.5) * 20 - 10;
            cols[i*3] = 0.2; cols[i*3+1] = 0.22; cols[i*3+2] = 0.28;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        this.bgStars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.008, vertexColors: true, transparent: true, opacity: 0.4 }));
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

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pos = [], cols = [], orig = [];
        for(let i=0; i<data.length; i+=4) {
            if(data[i+3] > 80) {
                const ix = (i/4 % canvas.width), iy = Math.floor(i/4 / canvas.width);
                const px = (ix/canvas.width - 0.5) * 8, py = (0.5 - iy/canvas.height) * 8;
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
        const time = Date.now() * 0.0008;
        if(this.bgStars) this.bgStars.rotation.y += 0.0001;
        if(this.nebula) {
            const attr = this.nebula.geometry.attributes.position;
            const orig = this.nebula.userData.orig;
            for(let i=0; i<attr.count; i++) {
                attr.array[i*3] = orig[i*3] + (Math.random()-0.5) * this.config.brownian;
                attr.array[i*3+1] = orig[i*3+1] + (Math.random()-0.5) * this.config.brownian;
                attr.array[i*3+2] = orig[i*3+2] + Math.sin(time + orig[i*3] * 0.5) * 0.1;
            }
            attr.needsUpdate = true;
        }
        this.composer.render();
    }
}
