import React from 'react'
import * as THREE from 'three'; 

export const Three = () => {
    const refContainer = React.useRef<HTMLDivElement>(null); 

    React.useEffect(() => {
        const scene = new THREE.Scene(); 
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000); 
        const renderer = new THREE.WebGLRenderer(); 

        renderer.setSize(window.innerWidth - 200, window.innerHeight - 200); 

        console.log('added element'); 

        if(refContainer.current && !refContainer.current.contains(renderer.domElement))
            refContainer.current.appendChild(renderer.domElement); 

        const geometry = new THREE.BoxGeometry(1, 1, 1); 
        const material = new THREE.MeshBasicMaterial({color: "#00FF00"}); 
        const cube = new THREE.Mesh(geometry, material); 

        scene.add(cube); 
        camera.position.z = 5; 

        var animate = () => {
            requestAnimationFrame(animate); 
            cube.rotation.x += .01; 
            cube.rotation.y += .01; 
            renderer.render(scene, camera); 
        }

        animate(); 
    }, []); 

    return <div ref={refContainer} />
}