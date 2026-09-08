<template>
  <div class="hero-scene-container w-full h-full absolute inset-0 overflow-hidden" ref="canvasContainer">
    <canvas ref="canvasRef" class="w-full h-full block"></canvas>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'

const canvasContainer = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()

let animationFrameId: number | null = null
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null

// Mouse tracking for parallax
let mouseX = 0
let mouseY = 0
let targetMouseX = 0
let targetMouseY = 0

const handleMouseMove = (event: MouseEvent) => {
  const { innerWidth, innerHeight } = window
  targetMouseX = (event.clientX / innerWidth - 0.5) * 2
  targetMouseY = (event.clientY / innerHeight - 0.5) * 2
}

onMounted(() => {
  if (!canvasRef.value || !canvasContainer.value) return

  const container = canvasContainer.value
  const width = container.clientWidth || window.innerWidth
  const height = container.clientHeight || window.innerHeight

  // 1. Scene
  scene = new THREE.Scene()

  // 2. Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(0, 1.5, 7.5)

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  // 4. Lighting
  const ambientLight = new THREE.AmbientLight(0x141d4e, 1.5)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.5)
  dirLight.position.set(5, 10, 7)
  scene.add(dirLight)

  const greenSpot = new THREE.SpotLight(0x39ff14, 4, 25, Math.PI / 4, 0.5)
  greenSpot.position.set(-5, 6, -3)
  scene.add(greenSpot)

  const blueSpot = new THREE.SpotLight(0x00d4ff, 4, 25, Math.PI / 4, 0.5)
  blueSpot.position.set(5, 6, -3)
  scene.add(blueSpot)

  const goldRim = new THREE.DirectionalLight(0xffd700, 1.5)
  goldRim.position.set(0, -5, -4)
  scene.add(goldRim)

  // 5. Trophy Group
  const trophyGroup = new THREE.Group()
  trophyGroup.position.set(0, -0.6, 0)

  // Gold Material
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.92,
    roughness: 0.15,
    envMapIntensity: 1.0,
  })

  const darkBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f152d,
    metalness: 0.6,
    roughness: 0.3,
  })

  // Octagonal/Circular Plinth Base
  const basePlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.95, 0.25, 32),
    darkBaseMaterial
  )
  basePlinth.position.y = 0.125
  trophyGroup.add(basePlinth)

  // Gold Base Ring
  const baseGoldRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.8, 0.15, 32),
    goldMaterial
  )
  baseGoldRing.position.y = 0.32
  trophyGroup.add(baseGoldRing)

  // Trophy Stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.3, 0.8, 24),
    goldMaterial
  )
  stem.position.y = 0.75
  trophyGroup.add(stem)

  // Trophy Cup Body
  const cupGeometry = new THREE.CylinderGeometry(0.75, 0.25, 1.1, 32, 1, true)
  const cup = new THREE.Mesh(cupGeometry, goldMaterial)
  cup.position.y = 1.6
  trophyGroup.add(cup)

  // Cup Bottom Dome
  const cupBottom = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    goldMaterial
  )
  cupBottom.position.y = 1.05
  cupBottom.rotation.x = Math.PI
  trophyGroup.add(cupBottom)

  // Trophy Rim Torus
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.05, 16, 48),
    goldMaterial
  )
  rim.position.y = 2.15
  rim.rotation.x = Math.PI / 2
  trophyGroup.add(rim)

  // Left Handle
  const handleGeo = new THREE.TorusGeometry(0.35, 0.045, 16, 32, Math.PI * 1.1)
  const leftHandle = new THREE.Mesh(handleGeo, goldMaterial)
  leftHandle.position.set(-0.85, 1.6, 0)
  leftHandle.rotation.z = -0.4
  trophyGroup.add(leftHandle)

  // Right Handle
  const rightHandle = new THREE.Mesh(handleGeo, goldMaterial)
  rightHandle.position.set(0.85, 1.6, 0)
  rightHandle.rotation.z = Math.PI + 0.4
  trophyGroup.add(rightHandle)

  scene.add(trophyGroup)

  // 6. Particle Field (Esports particles)
  const particleCount = 180
  const particleGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  const greenColor = new THREE.Color('#39ff14')
  const blueColor = new THREE.Color('#00d4ff')
  const goldColor = new THREE.Color('#ffd700')

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16
    positions[i * 3 + 1] = Math.random() * 9 - 1
    positions[i * 3 + 2] = (Math.random() - 0.5) * 16

    const chosenColor = i % 3 === 0 ? greenColor : (i % 3 === 1 ? blueColor : goldColor)
    colors[i * 3] = chosenColor.r
    colors[i * 3 + 1] = chosenColor.g
    colors[i * 3 + 2] = chosenColor.b
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const particleMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  })

  const particles = new THREE.Points(particleGeo, particleMat)
  scene.add(particles)

  // 7. Resize Observer
  const handleResize = () => {
    if (!container || !renderer || !camera) return
    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)

  // 8. Animation Loop
  let clock = new THREE.Clock()

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate)

    const delta = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()

    // Smooth mouse parallax lerp
    mouseX += (targetMouseX - mouseX) * 0.05
    mouseY += (targetMouseY - mouseY) * 0.05

    // Rotate Trophy
    trophyGroup.rotation.y = elapsedTime * 0.35 + mouseX * 0.3
    trophyGroup.rotation.x = mouseY * 0.15
    trophyGroup.position.y = -0.6 + Math.sin(elapsedTime * 1.2) * 0.12

    // Float Particles upwards
    const posArr = particleGeo.attributes.position.array as Float32Array
    for (let i = 0; i < particleCount; i++) {
      posArr[i * 3 + 1] += delta * 0.25
      posArr[i * 3] += Math.sin(elapsedTime + i) * delta * 0.06

      if (posArr[i * 3 + 1] > 8) {
        posArr[i * 3 + 1] = -1
        posArr[i * 3] = (Math.random() - 0.5) * 16
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 16
      }
    }
    particleGeo.attributes.position.needsUpdate = true

    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }

  animate()
})

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', () => {})
  window.removeEventListener('mousemove', handleMouseMove)
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.hero-scene-container {
  pointer-events: none;
}
</style>
