(function (global) {
    const DEFAULTS = {
        loaderPath: './ldraw/',
        ldConfigFiles: ['LDConfig.ldr'],
        background: 0x050505,
        grid: { size: 800, divisions: 40, color1: 0x1f7cbf, color2: 0x0d2740 },
        axesSize: 200
    };

    function noop() {}

    function createPrimeViewer(options = {}) {
        if (!global.THREE || !global.THREE.LDrawLoader) {
            throw new Error('THREE.LDrawLoader is required before creating the prime viewer.');
        }

        const cfg = { ...DEFAULTS, ...options };
        const canvasHost = cfg.canvas;
        if (!canvasHost) {
            throw new Error('createPrimeViewer requires options.canvas (DOM element).');
        }

        const engine = {
            scene: null,
            camera: null,
            renderer: null,
            controls: null,
            gridHelper: null,
            axesHelper: null,
            loader: null,
            modelWrapper: null,
            currentMeta: null,
            autoSpin: false,
            diagnostics: {
                grid: true,
                axes: true,
                flipY: false,
                wireframe: false,
                showEdges: true,
                backfaceCull: false
            },
            _events: {},
            ready: null
        };

        setupThree(engine, canvasHost, cfg);
        engine.loader = new THREE.LDrawLoader();
        engine.loader.path = cfg.loaderPath;
        if (cfg.fileMap) {
            engine.loader.setFileMap({ ...cfg.fileMap });
        }

        engine.ready = preloadLDConfig(engine.loader, cfg.ldConfigFiles);
        animate(engine);

        engine.on = function (event, handler = noop) {
            if (!engine._events[event]) engine._events[event] = [];
            engine._events[event].push(handler);
            return () => {
                engine._events[event] = engine._events[event].filter(h => h !== handler);
            };
        };

        engine.emit = function (event, payload) {
            (engine._events[event] || []).forEach(handler => handler(payload));
        };

        engine.setFileMap = function (map) {
            if (!map) return;
            engine.loader.setFileMap({ ...map });
        };

        engine.setAutoSpin = function (value) {
            engine.autoSpin = !!value;
        };

        engine.setDiagnostics = function (patch) {
            engine.diagnostics = { ...engine.diagnostics, ...patch };
            applyDiagnostics(engine);
            if (patch.grid !== undefined && engine.gridHelper) {
                engine.gridHelper.visible = !!engine.diagnostics.grid;
            }
            if (patch.axes !== undefined && engine.axesHelper) {
                engine.axesHelper.visible = !!engine.diagnostics.axes;
            }
            if (patch.flipY !== undefined) {
                engine.fitToCurrent();
            }
        };
        
        engine.setBackgroundColor = function (color) {
            const threeColor = new THREE.Color(color);
            engine.scene.background = threeColor;
            engine.renderer.setClearColor(threeColor);
            engine.render();
        };

        engine.loadPath = async function (path, meta = {}, onProgress) {
            await engine.ready;
            return new Promise((resolve, reject) => {
                engine.loader.load(path, group => {
                    try {
                        finalizeGroup(engine, group, meta, path);
                        resolve(group);
                    } catch (err) {
                        reject(err);
                    }
                }, onProgress, err => reject(err));
            });
        };

        engine.loadText = async function (text, meta = {}, virtualPath = 'manual-input.ldr') {
            await engine.ready;
            return new Promise((resolve, reject) => {
                try {
                    engine.loader.parse(text, virtualPath, group => {
                        try {
                            finalizeGroup(engine, group, meta, virtualPath);
                            resolve(group);
                        } catch (err) {
                            reject(err);
                        }
                    });
                } catch (err) {
                    reject(err);
                }
            });
        };

        engine.clear = function () {
            if (engine.modelWrapper) {
                engine.scene.remove(engine.modelWrapper);
                engine.modelWrapper = null;
            }
            engine.currentMeta = null;
            engine.emit('model:cleared');
        };

        engine.fitToCurrent = function () {
            if (!engine.modelWrapper) return;
            fitCamera(engine, engine.modelWrapper);
        };

        engine.getStats = function () {
            return engine.modelWrapper ? computeStats(engine.modelWrapper) : { meshes: 0, lines: 0, triangles: 0 };
        };

        engine.getMeta = function () {
            return engine.currentMeta ? { ...engine.currentMeta } : null;
        };
        engine.displayGroup = function (group, meta = {}, sourceLabel = 'Direct') {
            finalizeGroup(engine, group, meta, sourceLabel);
            return group;
        };

        engine.updateRendererSize = function () {
            const container = canvasHost;
            if (!container || !engine.renderer) return;
            engine.camera.aspect = container.clientWidth / container.clientHeight;
            engine.camera.updateProjectionMatrix();
            engine.renderer.setSize(container.clientWidth, container.clientHeight);
        };

        window.addEventListener('resize', () => engine.updateRendererSize());

        return engine;
    }

    function setupThree(engine, container, cfg) {
        engine.scene = new THREE.Scene();
        engine.scene.background = new THREE.Color(cfg.background);

        const aspect = container.clientWidth / container.clientHeight;
        engine.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 20000);
        engine.camera.position.set(200, 200, 200);

        // Create renderer without canvas param (let it create its own)
        engine.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            preserveDrawingBuffer: true  
        });
        engine.renderer.setPixelRatio(window.devicePixelRatio);
        engine.renderer.setSize(container.clientWidth, container.clientHeight);
        
        // Clear container and add the renderer's canvas
        container.innerHTML = '';
        container.appendChild(engine.renderer.domElement);

        engine.controls = new THREE.OrbitControls(engine.camera, engine.renderer.domElement);
        engine.controls.enableDamping = true;
        engine.controls.dampingFactor = 0.08;

        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        engine.scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(200, 300, 150);
        engine.scene.add(dir);

        engine.gridHelper = new THREE.GridHelper(
            cfg.grid.size,
            cfg.grid.divisions,
            cfg.grid.color1,
            cfg.grid.color2
        );
        engine.scene.add(engine.gridHelper);

        engine.axesHelper = new THREE.AxesHelper(cfg.axesSize);
        engine.scene.add(engine.axesHelper);

        engine.gridHelper.visible = !!engine.diagnostics.grid;
        engine.axesHelper.visible = !!engine.diagnostics.axes;
    }

    function preloadLDConfig(loader, files = []) {
        if (!files || !files.length) return Promise.resolve();
        const loads = files.map((file) =>
            new Promise((resolve) => {
                loader.load(file, () => resolve(), undefined, () => resolve());
            })
        );
        return Promise.all(loads);
    }

    function finalizeGroup(engine, group, meta, sourceLabel) {
        if (!group) throw new Error('Loaded model is empty.');
        engine.clear();

        group.rotation.x = Math.PI;
        const wrapper = new THREE.Group();
        wrapper.add(group);
        engine.scene.add(wrapper);

        engine.modelWrapper = wrapper;
        engine.currentMeta = { ...meta, source: sourceLabel };

        // Fit camera and force immediate render
        fitCamera(engine, engine.modelWrapper);
        applyDiagnostics(engine);
        engine.renderer.render(engine.scene, engine.camera);
        
        const stats = engine.getStats();
        engine.emit('model:loaded', {
            meta: engine.currentMeta,
            stats,
            source: sourceLabel
        });
    }

    function applyDiagnostics(engine) {
        const diag = engine.diagnostics;
        if (engine.modelWrapper) {
            engine.modelWrapper.scale.y = diag.flipY ? -1 : 1;
            engine.modelWrapper.updateMatrixWorld(true);
        }

        if (!engine.modelWrapper) return;
        const frontSide = diag.backfaceCull ? THREE.FrontSide : THREE.DoubleSide;

        engine.modelWrapper.traverse(child => {
            if (child.isMesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    if (!mat) return;
                    mat.wireframe = diag.wireframe;
                    mat.side = frontSide;
                    mat.needsUpdate = true;
                });
            } else if (child.isLine || child.isLineSegments) {
                child.visible = diag.showEdges;
            }
        });
    }

    function computeStats(object) {
        const stats = { meshes: 0, lines: 0, triangles: 0 };
        object.traverse(child => {
            if (child.isMesh && child.geometry) {
                stats.meshes += 1;
                const geom = child.geometry;
                let triCount = 0;
                if (geom.index) {
                    triCount = geom.index.count / 3;
                } else if (geom.attributes && geom.attributes.position) {
                    triCount = geom.attributes.position.count / 3;
                }
                stats.triangles += Math.round(triCount);
            } else if (child.isLine || child.isLineSegments) {
                stats.lines += 1;
            }
        });
        return stats;
    }

    function fitCamera(engine, group) {
        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim / (2 * Math.tan((engine.camera.fov * Math.PI) / 360));
        const cameraOffset = distance * 1.5;
        
        // Position camera to see the model
        engine.camera.position.set(center.x + cameraOffset, center.y + cameraOffset, center.z + cameraOffset);
        engine.camera.lookAt(center);
        engine.controls.target.copy(center);
        engine.controls.update();
        
        console.log('[FIT] Camera positioned:', {
            center: center.toArray(),
            maxDim,
            distance: cameraOffset
        });
    }

    function animate(engine) {
        function loop() {
            requestAnimationFrame(loop);
            if (engine.modelWrapper && engine.autoSpin) {
                engine.modelWrapper.rotation.y += 0.01;
            }
            if (engine.controls) engine.controls.update();
            if (engine.renderer && engine.scene && engine.camera) {
                engine.renderer.render(engine.scene, engine.camera);
            }
        }
        loop();
    }

    global.BetaPrimeEngine = {
        create: createPrimeViewer
    };
})(window);
