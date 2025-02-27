import { useRef, useEffect } from 'react'
import { Edges } from '@react-three/drei'


// This mesh follows the object. put stuffs in it.
// Its position and orientation is controlled by the THREE.js helper

const ObjectFollower = (props) => {
  const objRef = useRef()
  
  useEffect(() => {
    const threeObject3D = objRef.current
    props.threeHelper.set_objectFollower(props.label, threeObject3D)
  }, [])

  useEffect(() => {
    if (props.isInitialized){
      objRef.current.visible = true
    }
  }, [props.isInitialized])

  const s = 0.5 // scale
  return (
    <object3D ref={objRef} visible={false}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[s, s, s*0.5]} />
        {/* Dirty hack: we set the material as transparent since it displays also the diagonal edges.
            We use DREI Edges to abstract THREE.EdgesGeometry */}
        <meshBasicMaterial color={0xff0000} wireframe={true} opacity={0} transparent={true} wireframeLinewidth={0} />
        <Edges
          linewidth={4}
          scale={1}
          threshold={15} // Display edges only when the angle between two faces exceeds this value (default=15 degrees)
          color={0x00ff00}
        />
      </mesh>
    </object3D>
  )
}


export default ObjectFollower 
