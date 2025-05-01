'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const Scene = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const houseModelRef = useRef<THREE.Object3D | null>(null);
  const houseBoxRef = useRef<THREE.BoxHelper | null>(null);
  const desktopModelRef = useRef<THREE.Object3D | null>(null);
  const bedModelRef = useRef<THREE.Object3D | null>(null);
  const chairModelRef = useRef<THREE.Object3D | null>(null);
  const robotModelRef = useRef<THREE.Object3D | null>(null);
  const robotMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const robotScreenRef = useRef<THREE.Mesh | null>(null);
  const robotBorderPlaneRef = useRef<THREE.Mesh | null>(null);
  const robotBorderRef = useRef<THREE.LineSegments | null>(null);
  const [showRobotScreen, setShowRobotScreen] = useState(false);
  const [isCameraLockedToChat, setIsCameraLockedToChat] = useState(false);
  const [showProjects, setShowProjects] = useState(true);
  const [showStart, setShowStart] = useState(true);
  const [showPause, setShowPause] = useState(false);
  const startModelRef = useRef<THREE.Object3D | null>(null);
  const pauseModelRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!mountRef.current || !isMounted) return;

    // Clear any existing content
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a1a);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x1a1a1a, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Handle mouse click
    const handleClick = (event: MouseEvent) => {
      if (!robotModelRef.current) return;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Check for project image click
      const projectImageClicked = intersects.find(intersect => {
        return intersect.object.userData && intersect.object.userData.url;
      });
      if (projectImageClicked) {
        const url = projectImageClicked.object.userData.url;
        if (url) {
          window.open(url, '_blank');
          return; // Prevent further handling (e.g., robot toggle)
        }
      }

      // Check for robot_walk.glb click
      const robotWalkClicked = intersects.some(intersect => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          if (obj === robotModelRef.current || obj.name === 'robot') return true;
          obj = obj.parent;
        }
        return false;
      });

      if (robotWalkClicked) {
        setShowRobotScreen(prev => {
          const newShowRobotScreen = !prev;
          setIsCameraLockedToChat(newShowRobotScreen);

          // Camera animation logic
          if (robotScreenRef.current) {
            if (newShowRobotScreen) {
              // Opening: move camera to view screen
              const screenPosition = robotScreenRef.current.position.clone();
              const cameraOffset = new THREE.Vector3(-20, 5, 20);
              const targetCameraPos = screenPosition.clone().add(cameraOffset);
              const startPos = camera.position.clone();
              const startRot = camera.rotation.clone();
              const endRot = new THREE.Euler();
              camera.position.copy(targetCameraPos);
              camera.lookAt(screenPosition);
              endRot.copy(camera.rotation);
              camera.position.copy(startPos);
              camera.rotation.copy(startRot);
              const duration = 1000;
              const startTime = Date.now();
              const animateCamera = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = (t: number) => t * t * (3 - 2 * t);
                const t = ease(progress);
                camera.position.lerpVectors(startPos, targetCameraPos, t);
                camera.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
                camera.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
                camera.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
                if (progress < 1) {
                  requestAnimationFrame(animateCamera);
                }
              };
              animateCamera();
              controls.target.copy(screenPosition);
              controls.minDistance = 30;
              controls.maxDistance = 50;
              controls.update();
            } else {
              // Closing: move camera to character model
              let charPos = new THREE.Vector3(0, 0, 0);
              if (character && character.object) {
                charPos = character.object.position.clone();
              }
              const cameraOffset = new THREE.Vector3(0, 35, 65); // Use same offset as when following character
              const targetCameraPos = charPos.clone().add(cameraOffset);
              const startPos = camera.position.clone();
              const startRot = camera.rotation.clone();
              camera.position.copy(targetCameraPos);
              camera.lookAt(charPos);
              const endRot = camera.rotation.clone();
              camera.position.copy(startPos);
              camera.rotation.copy(startRot);
              const duration = 1000;
              const startTime = Date.now();
              const animateCamera = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = (t: number) => t * t * (3 - 2 * t);
                const t = ease(progress);
                camera.position.lerpVectors(startPos, targetCameraPos, t);
                camera.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
                camera.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
                camera.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
                if (progress < 1) {
                  requestAnimationFrame(animateCamera);
                }
              };
              animateCamera();
              controls.target.copy(charPos);
              controls.minDistance = 0;
              controls.maxDistance = Infinity;
              controls.update();
            }
          }
          return newShowRobotScreen;
        });
      }

      // Check for start.glb click
      const startClicked = intersects.some(intersect => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          if (obj === startModelRef.current) return true;
          obj = obj.parent;
        }
        return false;
      });
      if (startClicked) {
        setShowStart(false);
        setShowPause(true);

        // Move camera to projector screen
        // Find the projector screen mesh in the scene
        const projectorScreen = scene.getObjectByName('projectorScreen') as THREE.Mesh;
        if (projectorScreen) {
          // Target position: a bit in front of the screen, slightly above
          const screenPos = projectorScreen.position.clone();
          const cameraOffset = new THREE.Vector3(0, 0, 45); // 60 units in front of the screen
          // Rotate offset by the screen's rotation
          cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), projectorScreen.rotation.y);
          const targetCameraPos = screenPos.clone().add(cameraOffset);
          const startPos = camera.position.clone();
          const startRot = camera.rotation.clone();

          // Set up lookAt rotation
          camera.position.copy(targetCameraPos);
          camera.lookAt(screenPos);
          const endRot = camera.rotation.clone();
          camera.position.copy(startPos);
          camera.rotation.copy(startRot);

          // Animate camera movement
          const duration = 1000;
          const startTime = Date.now();
          const animateCamera = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = (t: number) => t * t * (3 - 2 * t);
            const t = ease(progress);
            camera.position.lerpVectors(startPos, targetCameraPos, t);
            camera.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
            camera.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
            camera.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
            if (progress < 1) {
              requestAnimationFrame(animateCamera);
            }
          };
          animateCamera();

          // Update controls to target the screen
          controls.target.copy(screenPos);
          controls.minDistance = 30;
          controls.maxDistance = 80;
          controls.update();
        }
        return;
      }

      // Check for pause.glb click
      const pauseClicked = intersects.some(intersect => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          if (obj === pauseModelRef.current) return true;
          obj = obj.parent;
        }
        return false;
      });
      if (pauseClicked) {
        setShowStart(true);
        setShowPause(false);

        // Move camera back to character position
        if (character.object) {
          const charPos = character.object.position.clone();
          const cameraOffset = new THREE.Vector3(0, 35, 65); // Use same offset as when following character
          const targetCameraPos = charPos.clone().add(cameraOffset);
          const startPos = camera.position.clone();
          const startRot = camera.rotation.clone();

          // Set up lookAt rotation
          camera.position.copy(targetCameraPos);
          camera.lookAt(charPos);
          const endRot = camera.rotation.clone();
          camera.position.copy(startPos);
          camera.rotation.copy(startRot);

          // Animate camera movement
          const duration = 1000;
          const startTime = Date.now();
          const animateCamera = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = (t: number) => t * t * (3 - 2 * t);
            const t = ease(progress);
            camera.position.lerpVectors(startPos, targetCameraPos, t);
            camera.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
            camera.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
            camera.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
            if (progress < 1) {
              requestAnimationFrame(animateCamera);
            }
          };
          animateCamera();

          // Update controls to target the character
          controls.target.copy(charPos);
          controls.minDistance = 0;
          controls.maxDistance = Infinity;
          controls.update();
        }

        // Check for bed.glb click
        console.log('bedModelRef.current:', bedModelRef.current);
        console.log('intersects:', intersects.map(i => i.object.name));
        const bedClicked = intersects.some(intersect => {
          let obj: THREE.Object3D | null = intersect.object;
          while (obj) {
            if (obj === bedModelRef.current || obj.name === 'bed') return true;
            obj = obj.parent;
          }
          return false;
        });
        if (bedClicked) {
          // Move character to bed and play sitting animation
          if (bedModelRef.current && character.object) {
            // Move character to bed position (adjust y as needed for correct sitting position)
            character.object.position.copy(bedModelRef.current.position.clone().add(new THREE.Vector3(0, 20, 0)));
            character.object.rotation.y = bedModelRef.current.rotation.y;
          }
          // Load sitting animation
          loadModel('/model/Sitting.fbx');
          return;
        }

        // Check for gamingChair.glb click
        const chairClicked = intersects.some(intersect => {
          let obj: THREE.Object3D | null = intersect.object;
          while (obj) {
            if (obj === chairModelRef.current || obj.name === 'chair') return true;
            obj = obj.parent;
          }
          return false;
        });
        if (chairClicked) {
          // Move character to chair and play sitting animation
          if (chairModelRef.current && character.object) {
            // Adjust the Y offset as needed for correct sitting position
            character.object.position.copy(chairModelRef.current.position.clone().add(new THREE.Vector3(0, 20, 0)));
            character.object.rotation.y = chairModelRef.current.rotation.y;
          }
          // Load sitting animation
          loadModel('/model/Sitting.fbx');
          return;
        }

        return;
      }
    };

    window.addEventListener('click', handleClick);

    // Character state
    const character = {
      object: null as THREE.Object3D | null,
      mixer: null as THREE.AnimationMixer | null,
      isWalking: false,
      walkSpeed: 30,
      direction: new THREE.Vector3(0, 0, 0),
    };

    // Load models function
    const loadModel = (modelPath: string) => {
      const fbxLoader = new FBXLoader();
      const textureLoader = new THREE.TextureLoader();
      // Load all PBR textures in parallel
      Promise.all([
        textureLoader.loadAsync('/model/texture_diffuse.png'),
        textureLoader.loadAsync('/model/texture_metallic.png'),
        textureLoader.loadAsync('/model/texture_roughness.png'),
        textureLoader.loadAsync('/model/texture_normal.png'),
      ]).then(([diffuse, metallic, roughness, normal]) => {
        fbxLoader.load(
          modelPath,
          (object) => {
            if (character.object) {
              scene.remove(character.object);
            }

            object.scale.set(0.007, 0.007, 0.007);
            const prevPosition = character.object ? character.object.position.clone() : new THREE.Vector3(60, 28, 150);
            const prevRotation = character.object ? character.object.rotation.clone() : new THREE.Euler(0, 0, 0);
            object.position.copy(prevPosition);
            object.rotation.copy(prevRotation);

            // Apply the PBR textures to all meshes
            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = new THREE.MeshStandardMaterial({
                  map: diffuse,
                  metalnessMap: metallic,
                  roughnessMap: roughness,
                  normalMap: normal,
                  metalness: 1.0,
                  roughness: 1.0,
                });
              }
            });

            character.object = object;
            character.mixer = new THREE.AnimationMixer(object);
            
            if (object.animations.length > 0) {
              const clip = object.animations[0];
              
              // Create a new animation clip that removes the root motion
              const tracks = [];
              for (let i = 0; i < clip.tracks.length; i++) {
                const track = clip.tracks[i];
                // Skip position tracks that affect the root bone
                if (!track.name.includes('mixamorigHips.position')) {
                  tracks.push(track);
                }
              }
              const staticClip = new THREE.AnimationClip('static_' + clip.name, clip.duration, tracks);
              
              const action = character.mixer.clipAction(staticClip);
              action.play();
            }

            scene.add(object);
          }
        );
      });
    };

    // Initial load of standing model
    loadModel('/model/Standing.fbx');

    // Poodle setup
    const poodle = {
      object: null as THREE.Object3D | null,
      mixer: null as THREE.AnimationMixer | null,
      isWalking: false,
      basePosition: new THREE.Vector3(40, 10, 150),
      targetPosition: new THREE.Vector3(40, 10, 150),
      walkSpeed: 5,
      runSpeed: 10,
      randomWalkRadius: 15,
      timeToNewTarget: 0
    };

    // Function to get random position within radius
    const getRandomPosition = () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * poodle.randomWalkRadius;
      const x = poodle.basePosition.x + Math.cos(angle) * radius;
      const z = poodle.basePosition.z + Math.sin(angle) * radius;
      return new THREE.Vector3(x, poodle.basePosition.y, z);
    };

    // Function to load poodle
    const loadPoodle = () => {
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        '/poodle/animations/walk/Poodle_Portrait_0428141001_texture_walk.glb',
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(0.3, 0.3, 0.3);
          
          // Set poodle at initial position
          model.position.copy(poodle.basePosition);
          
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          poodle.object = model;
          poodle.mixer = new THREE.AnimationMixer(model);
          
          if (gltf.animations.length > 0) {
            const action = poodle.mixer.clipAction(gltf.animations[0]);
            action.play();
          }

          scene.add(model);
        }
      );
    };

    // Keyboard controls
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
      }

      if (!character.isWalking) {
        character.isWalking = true;
        loadModel('/model/Walking.fbx');
      }

      switch (event.key) {
        case 'ArrowUp':
          character.direction.z = -1;
          if (character.object) character.object.rotation.y = Math.PI;
          break;
        case 'ArrowDown':
          character.direction.z = 1;
          if (character.object) character.object.rotation.y = 0;
          break;
        case 'ArrowLeft':
          character.direction.x = -1;
          if (character.object) character.object.rotation.y = -Math.PI / 2;
          break;
        case 'ArrowRight':
          character.direction.x = 1;
          if (character.object) character.object.rotation.y = Math.PI / 2;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          character.direction.z = 0;
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          character.direction.x = 0;
          break;
      }

      // If no keys are pressed, stop walking
      if (character.direction.x === 0 && character.direction.z === 0) {
        character.isWalking = false;
        loadModel('/model/Standing.fbx');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.enabled = true; // Enable mouse controls
    controls.enablePan = false; // Disable panning with keyboard

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add hemisphere light for soft sky/ground lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    // Sun-like directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(30, 100, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Optional: add a point light for highlights
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 200);
    pointLight.position.set(0, 50, 50);
    scene.add(pointLight);

    // Ground
    const groundWidth = 500;
    const groundDepth = 500;
    const groundThickness = 10; // Make this as thick as you want
    const groundGeometry = new THREE.BoxGeometry(groundWidth, groundThickness, groundDepth);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -groundThickness / 2; // So the top is at y=0
    ground.receiveShadow = true;
    ground.castShadow = false;
    scene.add(ground);

    // Load house
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/house/house.glb', (gltf) => {
      const model = gltf.scene;
      model.name = 'house';
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.name = 'house';
        }
      });
      model.scale.set(150, 120, 120);
      model.position.set(0, 0, 0);
      scene.add(model);
      houseModelRef.current = model;

      // Add box outline
      const boxHelper = new THREE.BoxHelper(model, 0x00ff00);
      boxHelper.name = 'houseBox';
      boxHelper.visible = false;//outter Box
      scene.add(boxHelper);
      houseBoxRef.current = boxHelper;

      // Add center box
      const houseBox = new THREE.Box3().setFromObject(model);
      const houseCenter = new THREE.Vector3();
      houseBox.getCenter(houseCenter);
      
      // Create a box geometry for the center area
      //TODO: Inner box 
      const centerBoxSize = new THREE.Vector3(150, 50, 100); // Size of the center box
      const centerBoxGeometry = new THREE.BoxGeometry(
        centerBoxSize.x,
        centerBoxSize.y,
        centerBoxSize.z
      );
      
      // Create wireframe material
      const centerBoxMaterial = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });
      
      // Create mesh and position it at house center
      const centerBox = new THREE.Mesh(centerBoxGeometry, centerBoxMaterial);
      centerBox.position.copy(houseCenter);
      centerBox.position.y = 26; // Moved up by 20 units (from 20 to 40)
      centerBox.position.z = -20;
      centerBox.position.x = -18;
      centerBox.name = 'centerBox';
      centerBox.visible = false; //Inner Box : centerBox; Outter Box ： boxHelper
      scene.add(centerBox);

      // Load poodle after house is loaded
      loadPoodle();

      // Load and display house/destop.glb
      gltfLoader.load('/house/desktop.glb', (gltf2) => {
        const destopModel = gltf2.scene;
        destopModel.name = 'destop';
        destopModel.scale.set(30, 30, 30); // Adjust scale as needed
        destopModel.position.set(0, 0, -78); // Position near the house
        scene.add(destopModel);
        desktopModelRef.current = destopModel;
      });

      gltfLoader.load('/house/bed.glb', (gltf2) => {
        const bedModel = gltf2.scene;
        bedModel.name = 'bed';
        bedModel.scale.set(25, 20, 40); // Adjust scale as needed
        bedModel.position.set(-78, 0, -45); // Position near the house
        scene.add(bedModel);
        bedModelRef.current = bedModel;
      });
      gltfLoader.load('/house/robot.glb', (gltf2) => {
        const robotModel = gltf2.scene;
        robotModel.name = 'robot';
        robotModel.scale.set(10, 10, 10); // Adjust scale as needed
        robotModel.position.set(53, 0, -50); // Position near the house
        robotModel.rotateY(-Math.PI / 4); // Rotate 45 degrees around Y axis
        scene.add(robotModel);
        robotModelRef.current = robotModel;
      });

      gltfLoader.load('/house/showcase.glb', (gltf2) => {
        const showcaseModel = gltf2.scene;
        showcaseModel.name = 'projectTitle';
        showcaseModel.scale.set(15, 15, 15); // Adjust scale as needed
        showcaseModel.position.set(53, 60, -50); // Position near the house
        showcaseModel.rotateY(-Math.PI / 4); // Rotate 45 degrees around Y axis
        scene.add(showcaseModel);
        // Optionally add a showcaseModelRef if needed
      });

      if (showStart) {
        gltfLoader.load('/house/start.glb', (gltf2) => {
          const startModel = gltf2.scene;
          startModel.name = 'startModel';
          startModel.scale.set(5, 5, 5);
          startModel.position.set(37, 60, -66);
          startModel.rotateY(-Math.PI / 4);
          scene.add(startModel);
          startModelRef.current = startModel;
        });
      } else {
        gltfLoader.load('/house/pause.glb', (gltf2) => {
          const pauseModel = gltf2.scene;
          pauseModel.name = 'pauseModel';
          pauseModel.scale.set(5, 5, 5);
          pauseModel.position.set(37, 60, -66);
          pauseModel.rotateY(-Math.PI / 4);
          scene.add(pauseModel);
          pauseModelRef.current = pauseModel;
        });
      }

      gltfLoader.load('/house/projectTitle.glb', (gltf2) => {
        const projectTitleModel = gltf2.scene;
        projectTitleModel.name = 'projectTitle';
        projectTitleModel.scale.set(16, 16, 16); // Adjust scale as needed
        projectTitleModel.position.set(67, 0, -36); // Position near the house
        projectTitleModel.rotateY(-Math.PI / 4); // Rotate 45 degrees around Y axis
        scene.add(projectTitleModel);
        // Optionally add a projectTitleModelRef if needed
      });

      gltfLoader.load('/house/eemun.glb', (gltf2) => {
        const eemunTitleModel = gltf2.scene;
        eemunTitleModel.name = 'eemunTitle';
        eemunTitleModel.scale.set(15, 15, 15); // Adjust scale as needed
        eemunTitleModel.position.set(39, 0, -64); // Position near the house
        eemunTitleModel.rotateY(-Math.PI / 4); // Rotate 45 degrees around Y axis
        scene.add(eemunTitleModel);
        // Optionally add a eemunTitleModelRef if needed
      });

      gltfLoader.load('/house/gamingChair.glb', (gltf2) => {
        const chairModel = gltf2.scene;
        chairModel.name = 'chair';
        chairModel.scale.set(20, 20, 20); // Adjust scale as needed
        chairModel.position.set(0, 0, -50); // Position near the house
        chairModel.rotateY(Math.PI);
        scene.add(chairModel);
        chairModelRef.current = chairModel;
      });
      gltfLoader.load('/house/blindbox.glb', (gltf2) => {
        const blindboxModel = gltf2.scene;
        blindboxModel.name = 'blindbox';
        blindboxModel.scale.set(30, 20, 30); // Adjust scale as needed
        blindboxModel.position.set(-45, 1, -78); // Position near the house       
        //blindboxModel.rotateY(Math.PI);
        scene.add(blindboxModel);
        // Optionally add a blindboxModelRef if needed
      });

      gltfLoader.load('/house/robot_walk.glb', (gltf2) => {
        const robotModel = gltf2.scene;
        robotModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.userData.isRobotWalk = true; // Mark all meshes as part of robot_walk
          }
        });
        robotModel.scale.set(0.2, 0.2, 0.2);
        robotModel.position.set(-45, 47, -78);
        scene.add(robotModel);
        robotModelRef.current = robotModel;

        // Set up animation mixer for robot
        if (gltf2.animations.length > 0) {
          robotMixerRef.current = new THREE.AnimationMixer(robotModel);
          const action = robotMixerRef.current.clipAction(gltf2.animations[0]);
          action.play();
        }

        // Add a second projector screen near the robot
        const screenWidth = 40;   // width of the screen
        const screenHeight = 25;  // height of the screen
        const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
        const screenMaterial = new THREE.MeshStandardMaterial({
          color: 0xFFC0CB,
          side: THREE.DoubleSide,
          roughness: 0.7,
          metalness: 0.1,
          transparent: true,
          opacity: 0.5
        });
        const robotProjectorScreen = new THREE.Mesh(screenGeometry, screenMaterial);
        robotProjectorScreen.position.set(-45, 60, -78); // Position above the robot
        robotProjectorScreen.name = 'robotProjectorScreen';
        robotProjectorScreen.visible = false; // Start hidden
        scene.add(robotProjectorScreen);
        robotScreenRef.current = robotProjectorScreen;

        // Add a black border plane behind the screen for a thick border effect
        const borderPlaneGeometry = new THREE.PlaneGeometry(screenWidth + 2, screenHeight + 2);
        const borderPlaneMaterial = new THREE.MeshBasicMaterial({
          color: 0xFFC0CB,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        });
        const borderPlane = new THREE.Mesh(borderPlaneGeometry, borderPlaneMaterial);
        borderPlane.position.copy(robotProjectorScreen.position);
        borderPlane.rotation.copy(robotProjectorScreen.rotation);
        borderPlane.position.z -= 0.2; // Slightly further behind the screen
        borderPlane.visible = false; // Start hidden
        scene.add(borderPlane);
        robotBorderPlaneRef.current = borderPlane;

        // Add a thin outline border using EdgesGeometry
        const edgeGeometry = new THREE.EdgesGeometry(screenGeometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xFFC0CB, linewidth: 2 });
        const border = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        border.position.copy(robotProjectorScreen.position);
        border.rotation.copy(robotProjectorScreen.rotation);
        border.visible = false; // Start hidden
        scene.add(border);
        robotBorderRef.current = border;
      });
      
      gltfLoader.load('/house/wardrobe.glb', (gltf2) => {
        const chairModel = gltf2.scene;
        chairModel.name = 'wardrobe';
        chairModel.scale.set(30, 30, 30); // Adjust scale as needed
        chairModel.position.set(63, 1, 10); // Position near the house
        chairModel.rotateY(-Math.PI/2 - Math.PI/6); // Added 30 degrees (-Math.PI/6)
        scene.add(chairModel);
        chairModelRef.current = chairModel;
      });

      gltfLoader.load('/house/coffeebar.glb', (gltf2) => {
        const bedModel = gltf2.scene;
        bedModel.name = 'coffeebar';
        bedModel.scale.set(40, 40, 40); // Adjust scale as needed
        bedModel.position.set(-60, 0, 40); // Position near the house
        bedModel.rotateY(Math.PI); // Rotate 45 degrees around Y axis
        scene.add(bedModel);
        bedModelRef.current = bedModel;
      });

      // Add a 3D flat projector screen
      const screenWidth = 60;   // width of the screen
      const screenHeight = 35;  // height of the screen
      const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
      const screenMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFC0CB, // color doesn't matter if fully transparent
        side: THREE.DoubleSide,
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0.5 // Fully see-through
      });
      const projectorScreen = new THREE.Mesh(screenGeometry, screenMaterial);
      projectorScreen.position.set(50, 40, -50); // Adjust position as needed
      projectorScreen.rotation.y = -Math.PI / 4 ; // Rotate 225 degrees around Y axis
      projectorScreen.name = 'projectorScreen';
      scene.add(projectorScreen);

      // Add a black border plane behind the screen for a thick border effect
      const borderPlaneGeometry = new THREE.PlaneGeometry(screenWidth + 2, screenHeight + 2);
      const borderPlaneMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFC0CB,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const borderPlane = new THREE.Mesh(borderPlaneGeometry, borderPlaneMaterial);
      borderPlane.position.copy(projectorScreen.position);
      borderPlane.rotation.copy(projectorScreen.rotation);
      borderPlane.position.z -= 0.2; // Slightly further behind the screen
      scene.add(borderPlane);

      // Add a thin outline border using EdgesGeometry
      const edgeGeometry = new THREE.EdgesGeometry(screenGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xFFC0CB, linewidth: 2 });
      const border = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      border.position.copy(projectorScreen.position);
      border.rotation.copy(projectorScreen.rotation);
      scene.add(border);

      // Load and display portfolio/project1.png as a plane in the scene
      //project image (portfolio)
      const loader = new THREE.TextureLoader();
      loader.load('/portfolio/project1.png', (texture) => {
        const imgWidth = 15;  // Adjust as needed 
        const imgHeight = 8; // Adjust as needed
        const geometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const imagePlane = new THREE.Mesh(geometry, material);
        imagePlane.position.set(48, 40, -48); //center
        imagePlane.rotation.y = -Math.PI / 4 ; 
        imagePlane.name = 'project1Image';
        scene.add(imagePlane);
      });

      const projectImages = [
        { file: '/portfolio/project2.png', pos: [36, 50, -60] as [number, number, number], rotY: -Math.PI / 4, name: 'HackSplit', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project3.png', pos: [36, 40, -60] as [number, number, number], rotY: -Math.PI / 4, name: 'PawChain', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [36, 30, -60] as [number, number, number], rotY: -Math.PI / 4, name: 'Graphic Programming', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [48, 50, -48] as [number, number, number], rotY: -Math.PI / 4, name: 'Java', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [48, 30, -48] as [number, number, number], rotY: -Math.PI / 4, name: 'Mixue', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [60, 50, -36] as [number, number, number], rotY: -Math.PI / 4, name: 'TravelConnect', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [60, 40, -36] as [number, number, number], rotY: -Math.PI / 4, name: 'Recycle_Reward_System', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [60, 30, -36] as [number, number, number], rotY: -Math.PI / 4, name: 'CureMeBaby', url: 'https://eemunportfolio.vercel.app/' },
      ];

      // Only add project images if showProjects is true
      if (showProjects) {
        projectImages.forEach(({ file, pos, rotY, name, url }) => {
          loader.load(file, (texture) => {
            const imgWidth = 15;
            const imgHeight = 8;
            const geometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
            const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
            const imagePlane = new THREE.Mesh(geometry, material);
            imagePlane.position.set(...pos);
            imagePlane.rotation.y = rotY;
            imagePlane.name = name;
            imagePlane.userData.url = url;
            scene.add(imagePlane);
          });
        });
      }
    });

    // Camera position
    camera.position.set(15, 50, 250);
    camera.lookAt(0, 0, 150);

    // State to track if character is in house
    let isInHouse = false;
    let hasTeleportedToCenter = false;

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Update character movement and animation
      if (character.isWalking && character.object) {
        const moveDistance = character.walkSpeed * delta;
        let nextPosition = character.object.position.clone();
        nextPosition.x += character.direction.x * moveDistance;
        nextPosition.z += character.direction.z * moveDistance;

        // Get references to boxes
        const houseBox = houseModelRef.current ? new THREE.Box3().setFromObject(houseModelRef.current) : null;
        const centerBox = scene.getObjectByName('centerBox');
        const center = centerBox instanceof THREE.Mesh ? centerBox.position : new THREE.Vector3();
        //Inner box 
        const centerSize = new THREE.Vector3(150, 50, 100); // Use the same as centerBoxSize

        // Check for collision with obstacles
        let willCollide = false;
        const charBox = new THREE.Box3().setFromCenterAndSize(nextPosition, new THREE.Vector3(10, 40, 10));
        const obstacles = [desktopModelRef.current, bedModelRef.current, chairModelRef.current];
        for (const obj of obstacles) {
          if (obj) {
            const objBox = new THREE.Box3().setFromObject(obj);
            if (objBox.intersectsBox(charBox)) {
              willCollide = true;
              break;
            }
          }
        }

        // Check if character is in house (green box)
        if (houseBox && houseBox.containsPoint(nextPosition)) {
          if (!hasTeleportedToCenter) {
            // Teleport both character and poodle to center of inner box
            const centerPos = center.clone();
            centerPos.y = 28;
            character.object.position.copy(centerPos);

            if (poodle.object) {
              const poodleCenter = center.clone();
              poodleCenter.y = 10; // Set poodle's y position to -50
              poodle.object.position.copy(poodleCenter);
              poodle.targetPosition.copy(poodleCenter); // Update target position to prevent movement
              poodle.basePosition.copy(poodleCenter); // Update base position for random walk
            }

            isInHouse = true;
            hasTeleportedToCenter = true;
          }
        } else {
          isInHouse = false;
          hasTeleportedToCenter = false;
        }

        // Restrict movement to centerBox if in house and not colliding with obstacles
        if (isInHouse && centerBox instanceof THREE.Mesh && !willCollide) {
          // Only allow movement if next position is inside centerBox
          if (Math.abs(nextPosition.x - center.x) <= centerSize.x / 2 &&
              Math.abs(nextPosition.y - center.y) <= centerSize.y / 2 &&
              Math.abs(nextPosition.z - center.z) <= centerSize.z / 2) {
            character.object.position.copy(nextPosition);
          }
          // Camera and color logic for being inside the center box
          const cameraOffset = new THREE.Vector3(0, 35, -65);
          const targetCameraPos = character.object.position.clone().add(cameraOffset);
          camera.position.copy(targetCameraPos);
          camera.lookAt(character.object.position);
          controls.target.copy(character.object.position);
          
          // Limit camera zoom when inside the inner box
          controls.minDistance = 30; // Minimum zoom distance
          controls.maxDistance = 80; // Maximum zoom distance
          controls.update();
        } else if (!isInHouse && !willCollide) {
          // Normal movement outside house
          character.object.position.copy(nextPosition);
          
          // Update camera position to follow character from behind
          if (character.direction.z > 0) { // Moving down (character facing camera)
            const cameraOffset = new THREE.Vector3(0, 35, -65);
            const targetCameraPos = character.object.position.clone().add(cameraOffset);
            camera.position.copy(targetCameraPos);
            camera.lookAt(character.object.position);
            controls.target.copy(character.object.position);
          } else if (character.direction.z < 0) { // Moving up (character facing away)
            const cameraOffset = new THREE.Vector3(0, 35, 65);
            const targetCameraPos = character.object.position.clone().add(cameraOffset);
            camera.position.copy(targetCameraPos);
            camera.lookAt(character.object.position);
            controls.target.copy(character.object.position);
          } else if (character.direction.x !== 0) { // Moving left/right
            const cameraOffset = new THREE.Vector3(0, 35, 65);
            const targetCameraPos = character.object.position.clone().add(cameraOffset);
            camera.position.copy(targetCameraPos);
            camera.lookAt(character.object.position);
            controls.target.copy(character.object.position);
            if (character.object) {
              character.object.rotation.y = Math.PI;
            }
          }
          
          // Reset camera zoom limits when outside
          controls.minDistance = 0;
          controls.maxDistance = Infinity;
          controls.maxPolarAngle = Math.PI;
          controls.minPolarAngle = 0;
          if (centerBox instanceof THREE.Mesh) {
            (centerBox.material as THREE.MeshBasicMaterial).color.set(0x0000ff);
          }
        }

        // Poodle movement logic
        const minPoodleDistance = 25; // Minimum allowed distance between poodle and character
        const maxPoodleDistance = 45; // Maximum distance before poodle starts following
        if (poodle.object && character.object) {
          // Calculate intended next position for poodle
          let poodleNextPos = poodle.object.position.clone();
          const currentDistance = poodle.object.position.distanceTo(character.object.position);
          
          if (character.isWalking) {
            // Poodle follows character but maintains distance
            if (currentDistance > maxPoodleDistance) {
              // If too far, move closer
              poodle.targetPosition.copy(character.object.position).add(new THREE.Vector3(3, 0, 0));
              poodle.targetPosition.y = 10; // Keep y position at 10
            } else if (currentDistance < minPoodleDistance) {
              // If too close, move away
              const awayDirection = poodle.object.position.clone().sub(character.object.position).normalize();
              poodle.targetPosition.copy(character.object.position).add(awayDirection.multiplyScalar(minPoodleDistance));
              poodle.targetPosition.y = 10; // Keep y position at 10
            } else {
              // Maintain current distance
              poodle.targetPosition.copy(poodle.object.position);
            }
          }
          
          const direction = poodle.targetPosition.clone().sub(poodle.object.position);
          if (direction.length() > 0.1) {
            direction.normalize();
            poodleNextPos.add(direction.multiplyScalar(poodle.walkSpeed * delta));
            
            // Restrict poodle to centerBox with fixed y-value
            if (isInHouse && centerBox instanceof THREE.Mesh) {
              // Keep poodle's y position at 10
              poodleNextPos.y = 10;
              
              // Only allow movement if next position is inside centerBox
              if (Math.abs(poodleNextPos.x - center.x) <= centerSize.x / 2 &&
                  Math.abs(poodleNextPos.z - center.z) <= centerSize.z / 2) {
                poodle.object.position.copy(poodleNextPos);
              }
            } else {
              // Normal movement outside house
              poodleNextPos.y = 10; // Keep y position at 10
              poodle.object.position.copy(poodleNextPos);
            }
            
            // Make poodle face movement direction
            poodle.object.rotation.y = Math.atan2(direction.x, direction.z);
          }
        } else {
          // Random walk behavior when character is not moving
          if (poodle.object) {
            poodle.timeToNewTarget -= delta;
            
            // Get new random target position when timer expires or close to current target
            if (poodle.timeToNewTarget <= 0 || 
                poodle.object.position.distanceTo(poodle.targetPosition) < 0.5) {
              poodle.targetPosition.copy(getRandomPosition());
              poodle.targetPosition.y = 10; // Keep y position at 10
              poodle.timeToNewTarget = 3 + Math.random() * 2; // Random time between 3-5 seconds
            }

            // Move towards target position
            const direction = poodle.targetPosition.clone().sub(poodle.object.position);
            if (direction.length() > 0.1) {
              direction.normalize();
              poodle.object.position.add(direction.multiplyScalar(poodle.walkSpeed * delta));
              poodle.object.position.y = 10; // Keep y position at 10
              // Make poodle face movement direction
              poodle.object.rotation.y = Math.atan2(direction.x, direction.z);
            }
          }
        }
      } else {
        // Random walk behavior when character is not moving
        if (poodle.object) {
          poodle.timeToNewTarget -= delta;
          
          // Get new random target position when timer expires or close to current target
          if (poodle.timeToNewTarget <= 0 || 
              poodle.object.position.distanceTo(poodle.targetPosition) < 0.5) {
            poodle.targetPosition.copy(getRandomPosition());
            poodle.targetPosition.y = 10; // Keep y position at 10
            poodle.timeToNewTarget = 3 + Math.random() * 2; // Random time between 3-5 seconds
          }

          // Move towards target position
          const direction = poodle.targetPosition.clone().sub(poodle.object.position);
          if (direction.length() > 0.1) {
            direction.normalize();
            poodle.object.position.add(direction.multiplyScalar(poodle.walkSpeed * delta));
            poodle.object.position.y = 10; // Keep y position at 10
            // Make poodle face movement direction
            poodle.object.rotation.y = Math.atan2(direction.x, direction.z);
          }
        }
      }

      // Update animations
      if (character.mixer) {
        character.mixer.update(delta);
      }
      if (poodle.mixer) {
        poodle.mixer.update(delta);
      }
      if (robotMixerRef.current) {
        robotMixerRef.current.update(delta);
      }

      // If camera is locked to chat view, ensure it maintains the correct position
      if (isCameraLockedToChat && robotScreenRef.current) {
        const screenPosition = robotScreenRef.current.position.clone();
        controls.target.copy(screenPosition);
        
        // Limit camera movement while chatting
        controls.minDistance = 30;
        controls.maxDistance = 50;
        controls.minPolarAngle = Math.PI / 4; // Limit vertical rotation
        controls.maxPolarAngle = Math.PI / 2;
      } else {
        // Normal camera controls when not chatting
        controls.minDistance = 0;
        controls.maxDistance = Infinity;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      // Remove event listeners
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      // Dispose of scene resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else if (object.material) {
              object.material.dispose();
            }
          }
        });
      }

      // Dispose of renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // Stop animations
      if (character.mixer) {
        character.mixer.stopAllAction();
      }
      if (poodle.mixer) {
        poodle.mixer.stopAllAction();
      }
      if (robotMixerRef.current) {
        robotMixerRef.current.stopAllAction();
      }

      // Dispose of controls
      if (controls) {
        controls.dispose();
      }

      // Clear the mount point
      if (mountRef.current) {
        while (mountRef.current.firstChild) {
          mountRef.current.removeChild(mountRef.current.firstChild);
        }
      }
    };
  }, [isMounted]);

  // Update screen visibility when state changes
  useEffect(() => {
    if (robotScreenRef.current) {
      robotScreenRef.current.visible = showRobotScreen;
    }
    if (robotBorderPlaneRef.current) {
      robotBorderPlaneRef.current.visible = showRobotScreen;
    }
    if (robotBorderRef.current) {
      robotBorderRef.current.visible = showRobotScreen;
    }
  }, [showRobotScreen]);

  // Add this useEffect for project images:
  useEffect(() => {
    if (!sceneRef.current) return;
    // Remove all project images
    sceneRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.name.startsWith('project')) {
        sceneRef.current?.remove(obj);
      }
    });
    // Add project images if showProjects is true
    if (showProjects) {
      const loader = new THREE.TextureLoader();
      projectImages.forEach(({ file, pos, rotY, name, url }) => {
        loader.load(file, (texture) => {
          const imgWidth = 15;
          const imgHeight = 8;
          const geometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
          const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
          const imagePlane = new THREE.Mesh(geometry, material);
          imagePlane.position.set(...pos);
          imagePlane.rotation.y = rotY;
          imagePlane.name = name;
          imagePlane.userData.url = url;
          sceneRef.current?.add(imagePlane);
        });
      });
    }
  }, [showProjects]);

  // Add this useEffect for start/pause models:
  useEffect(() => {
    if (!sceneRef.current) return;
    // Remove start and pause models
    if (startModelRef.current) sceneRef.current?.remove(startModelRef.current);
    if (pauseModelRef.current) sceneRef.current?.remove(pauseModelRef.current);
    const gltfLoader = new GLTFLoader();
    if (showStart) {
      gltfLoader.load('/house/start.glb', (gltf2) => {
        const startModel = gltf2.scene;
        startModel.name = 'startModel';
        startModel.scale.set(5, 5, 5);
        startModel.position.set(37, 60, -66);
        startModel.rotateY(-Math.PI / 4);
        sceneRef.current?.add(startModel);
        startModelRef.current = startModel;
      });
    }
    if (showPause) {
      gltfLoader.load('/house/pause.glb', (gltf2) => {
        const pauseModel = gltf2.scene;
        pauseModel.name = 'pauseModel';
        pauseModel.scale.set(5, 5, 5);
        pauseModel.position.set(37, 60, -66);
        pauseModel.rotateY(-Math.PI / 4);
        sceneRef.current?.add(pauseModel);
        pauseModelRef.current = pauseModel;
      });
    }
  }, [showStart, showPause]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Scene; 