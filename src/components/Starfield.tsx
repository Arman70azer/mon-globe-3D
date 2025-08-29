import * as THREE from "three";

interface StarfieldOptions {
  numStars?: number;
  numShootingStars?: number;
}

export const createStarfield = ({
  numStars = 800,
  numShootingStars = 15,
}: StarfieldOptions = {}) => {
  const group = new THREE.Group();

  // Étoiles fixes
  const starVerts: number[] = [];
  const starColors: number[] = [];
  for (let i = 0; i < numStars; i++) {
    const radius = Math.random() * 50 + 30;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    const col = new THREE.Color().setHSL(0.6, 0.2, Math.random());
    starVerts.push(x, y, z);
    starColors.push(col.r, col.g, col.b);
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
  starGeo.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    fog: false,
  });

  const stars = new THREE.Points(starGeo, starMat);
  group.add(stars);

  // Étoiles filantes (de gauche → droite)
  const shootingStars = new THREE.Group();
  for (let i = 0; i < numShootingStars; i++) {
    const start = new THREE.Vector3(
      -40, // départ à gauche
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 60
    );
    const end = start.clone().add(new THREE.Vector3(3, 0, 0));
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: Math.random() * 0.7 + 0.3,
    });
    const line = new THREE.Line(geo, mat);
    line.userData.speed = Math.random() * 0.4 + 0.1;
    shootingStars.add(line);
  }
  group.add(shootingStars);

  // méthode d'update
  group.userData.update = () => {
    shootingStars.children.forEach((star: any) => {
      star.position.x += star.userData.speed;
      if (star.position.x > 90) {
        star.position.x = -40;
        star.position.y = (Math.random() - 0.5) * 40;
        star.position.z = (Math.random() - 0.5) * 60;
      }
    });
  };

  return group;
};
