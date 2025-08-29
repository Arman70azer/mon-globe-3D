import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import worldGeoJson from "./countries.json";
import { createStarfield } from "./Starfield";
import './style/globe.css';

const GlobeWithContinents: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const lonLatToVector3 = (lon: number, lat: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    let animationId: number;

    const initGlobe = () => {
      if (!mountRef.current) return null;

      // Clear any previous content
      mountRef.current.innerHTML = "";

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.z = window.innerWidth <= 768 ? 3.5 : 2;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      mountRef.current.appendChild(renderer.domElement);

      // Globe
      const globeRadius = 1;
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(globeRadius, 64, 64),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      scene.add(globe);

      // Lights
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0x333333));

      // Continents
      const continentMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
      worldGeoJson.features.forEach((feature: any) => {
        const polygons =
          feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.type === "MultiPolygon"
            ? feature.geometry.coordinates
            : [];

        polygons.forEach((polygon: any) => {
          polygon.forEach((ring: any) => {
            const points = ring.map(([lon, lat]: [number, number]) =>
              lonLatToVector3(lon, lat, globeRadius + 0.001)
            );
            points.push(points[0]);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, continentMaterial);
            globe.add(line);
          });
        });
      });

      // Stars
      const starfield = createStarfield({ numStars: 1000, numShootingStars: 10 });
      scene.add(starfield);

      // Center on France
      const franceLon = 46.2276;
      const franceLat = -30.2137;
      const phi = (90 - franceLat) * (Math.PI / 180);
      const theta = (franceLon + 180) * (Math.PI / 180);
      globe.rotation.y = -theta;
      globe.rotation.x = phi - Math.PI / 2;

      // OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enableZoom = false;
      controls.enablePan = false;

      let isDragging = false;
      renderer.domElement.addEventListener("mousedown", () => { isDragging = true; });
      renderer.domElement.addEventListener("mouseup", () => { isDragging = false; });

      // Animation
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        if (!isDragging) globe.rotation.y += 0.002;
        starfield.userData.update();
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      return { renderer, controls, scene };
    };

    let globeObjects = initGlobe();

    const handleResize = () => {
      globeObjects?.renderer.dispose();
      globeObjects = initGlobe();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (globeObjects?.renderer) {
        globeObjects.renderer.dispose();
      }
      if (mountRef.current) mountRef.current.innerHTML = "";
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <div ref={mountRef} className="globe-container" />;
};

export default GlobeWithContinents;
