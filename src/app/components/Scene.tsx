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
  const houseModelRef = useRef<THREE.Object3D | null>(null);
  const houseBoxRef = useRef<THREE.BoxHelper | null>(null);
  const desktopModelRef = useRef<THREE.Object3D | null>(null);
  const bedModelRef = useRef<THREE.Object3D | null>(null);
  const chairModelRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

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
      if (!houseModelRef.current) return;

      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Check if house was clicked
      const houseClicked = intersects.some(intersect => {
        let obj = intersect.object;
        while (obj.parent) {
          if (obj.name === 'house') return true;
          obj = obj.parent;
        }
        return obj.name === 'house';
      });

      if (houseClicked) {
        // Get the house's position in world space
        const housePosition = new THREE.Vector3();
        houseModelRef.current.getWorldPosition(housePosition);
        
        // Project the 3D position to screen coordinates
        const screenPosition = housePosition.clone().project(camera);
        
        // Convert to pixel coordinates
        const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = -(screenPosition.y * 0.5 - 0.5) * window.innerHeight;
        
        setButtonPosition({ x, y });
        setShowButton(true);
      } else {
        setShowButton(false);
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
      fbxLoader.load(
        modelPath,
        (object) => {
          if (character.object) {
            scene.remove(character.object);
          }

          object.scale.set(0.2, 0.2, 0.2);
          const prevPosition = character.object ? character.object.position.clone() : new THREE.Vector3(60, 20, 150);
          const prevRotation = character.object ? character.object.rotation.clone() : new THREE.Euler(0, 0, 0);
          object.position.copy(prevPosition);
          object.rotation.copy(prevRotation);

          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
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

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
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
      scene.add(centerBox);

      // Load poodle after house is loaded
      loadPoodle();

      // Load and display house/destop.glb
      gltfLoader.load('/house/desktop.glb', (gltf2) => {
        const destopModel = gltf2.scene;
        destopModel.name = 'destop';
        destopModel.scale.set(30, 30, 30); // Adjust scale as needed
        destopModel.position.set(0, 1, -78); // Position near the house
        scene.add(destopModel);
        desktopModelRef.current = destopModel;
      });

      gltfLoader.load('/house/bed.glb', (gltf2) => {
        const bedModel = gltf2.scene;
        bedModel.name = 'bed';
        bedModel.scale.set(25, 20, 40); // Adjust scale as needed
        bedModel.position.set(-78, 1, -45); // Position near the house
        scene.add(bedModel);
        bedModelRef.current = bedModel;
      });
      gltfLoader.load('/house/robot.glb', (gltf2) => {
        const bedModel = gltf2.scene;
        bedModel.name = 'robot';
        bedModel.scale.set(15, 15, 15); // Adjust scale as needed
        bedModel.position.set(53, 1, -50); // Position near the house
        bedModel.rotateY(-Math.PI / 4); // Rotate 45 degrees around Y axis
        scene.add(bedModel);
        bedModelRef.current = bedModel;
      });

      gltfLoader.load('/house/gamingChair.glb', (gltf2) => {
        const chairModel = gltf2.scene;
        chairModel.name = 'chair';
        chairModel.scale.set(20, 20, 20); // Adjust scale as needed
        chairModel.position.set(0, 1, -50); // Position near the house
        chairModel.rotateY(Math.PI);
        scene.add(chairModel);
        chairModelRef.current = chairModel;
      });
      gltfLoader.load('/house/blindbox.glb', (gltf2) => {
        const chairModel = gltf2.scene;
        chairModel.name = 'blindbox';
        chairModel.scale.set(30, 30, 30); // Adjust scale as needed
        chairModel.position.set(-20, 1, 50); // Position near the house       
        chairModel.rotateY(Math.PI);
 
        scene.add(chairModel);
        chairModelRef.current = chairModel;
      });
      
      gltfLoader.load('/house/wardrobe.glb', (gltf2) => {
        const chairModel = gltf2.scene;
        chairModel.name = 'wardrobe';
        chairModel.scale.set(30, 30, 30); // Adjust scale as needed
        chairModel.position.set(15, 1, 50); // Position near the house
        chairModel.rotateY(Math.PI);
        scene.add(chairModel);
        chairModelRef.current = chairModel;
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
        { file: '/portfolio/project1.png', pos: [36, 50, -60], rotY: -Math.PI / 4, name: 'project2Image' },
        { file: '/portfolio/project1.png', pos: [36, 40, -60], rotY: -Math.PI / 4, name: 'project3Image' },
        { file: '/portfolio/project1.png', pos: [36, 30, -60], rotY: -Math.PI / 4, name: 'project4Image' },
        { file: '/portfolio/project1.png', pos: [48, 50, -48], rotY: -Math.PI / 4, name: 'project5Image' },
        { file: '/portfolio/project1.png', pos: [48, 30, -48], rotY: -Math.PI / 4, name: 'project6Image' },
        { file: '/portfolio/project1.png', pos: [60, 50, -36], rotY: -Math.PI / 4, name: 'project7Image' },
        { file: '/portfolio/project1.png', pos: [60, 40, -36], rotY: -Math.PI / 4, name: 'project8Image' },
        { file: '/portfolio/project1.png', pos: [60, 30, -36], rotY: -Math.PI / 4, name: 'project9Image' },
      ];

      projectImages.forEach(({ file, pos, rotY, name }) => {
        loader.load(file, (texture) => {
          const imgWidth = 15;
          const imgHeight = 8;
          const geometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
          const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
          const imagePlane = new THREE.Mesh(geometry, material);
          imagePlane.position.set(...pos);
          imagePlane.rotation.y = rotY;
          imagePlane.name = name;
          scene.add(imagePlane);
        });
      });
    });

    // Camera position
    camera.position.set(15, 50, 400);
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
            // Teleport to center of house
            character.object.position.copy(center);
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
          const cameraOffset = new THREE.Vector3(0, 60, 50);
          const targetCameraPos = character.object.position.clone().add(cameraOffset);
          camera.position.copy(targetCameraPos);
          camera.lookAt(character.object.position);
          controls.target.copy(character.object.position);
          controls.minDistance = 20;
          controls.maxDistance = 80;
          controls.maxPolarAngle = Math.PI / 2;
          controls.minPolarAngle = Math.PI / 4;
          (centerBox.material as THREE.MeshBasicMaterial).color.set(0xff0000);
        } else if (!isInHouse && !willCollide) {
          // Normal movement outside house
          character.object.position.copy(nextPosition);
          controls.minDistance = 0;
          controls.maxDistance = Infinity;
          controls.maxPolarAngle = Math.PI;
          controls.minPolarAngle = 0;
          if (centerBox instanceof THREE.Mesh) {
            (centerBox.material as THREE.MeshBasicMaterial).color.set(0x0000ff);
          }
        }

        // Poodle movement logic
        const minPoodleDistance = 15; // Minimum allowed distance between poodle and character
        if (poodle.object && character.object) {
          // Calculate intended next position for poodle
          let poodleNextPos = poodle.object.position.clone();
          if (character.isWalking) {
            // Poodle follows character
            poodle.targetPosition.copy(character.object.position).add(new THREE.Vector3(3, -10, 0));
          }
          const direction = poodle.targetPosition.clone().sub(poodle.object.position);
          if (direction.length() > 0.1) {
            direction.normalize();
            const distToChar = poodle.object.position.distanceTo(character.object.position);
            if (distToChar > minPoodleDistance) {
              poodleNextPos.add(direction.multiplyScalar(poodle.walkSpeed * delta));
              // Restrict poodle to centerBox
              const centerBox = scene.getObjectByName('centerBox');
              const center = centerBox instanceof THREE.Mesh ? centerBox.position : new THREE.Vector3();
              const centerSize = new THREE.Vector3(150, 50, 100); // Use the same as your centerBoxSize
              if (
                poodleNextPos.distanceTo(character.object.position) >= minPoodleDistance &&
                Math.abs(poodleNextPos.x - center.x) <= centerSize.x / 2 &&
                Math.abs(poodleNextPos.y - center.y) <= centerSize.y / 2 &&
                Math.abs(poodleNextPos.z - center.z) <= centerSize.z / 2
              ) {
                poodle.object.position.copy(poodleNextPos);
              }
            }
            // Make poodle face movement direction
            poodle.object.rotation.y = Math.atan2(direction.x, direction.z);
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
            poodle.timeToNewTarget = 3 + Math.random() * 2; // Random time between 3-5 seconds
          }

          // Move towards target position
          const direction = poodle.targetPosition.clone().sub(poodle.object.position);
          if (direction.length() > 0.1) {
            direction.normalize();
            poodle.object.position.add(direction.multiplyScalar(poodle.walkSpeed * delta));
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
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {showButton && (
        <button
          style={{
            position: 'fixed',
            left: '50%',
            top: '80%',
            transform: 'translate(-50%, -50%)',
            padding: '20px 40px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            zIndex: 1000,
            fontSize: '24px',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            letterSpacing: '1px'
          }}
          onClick={() => {
            console.log('Button clicked!');
          }}
        >
          Exit House
        </button>
      )}
    </div>
  );
};

export default Scene; 