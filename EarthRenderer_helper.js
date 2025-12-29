    /**
     * Update particle colors from a loaded texture
     */
    updateParticleColorsFromTexture(texture) {
        if (!this.earth || !this.earth.geometry) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1024;
        canvas.height = 512;
        
        // Draw texture to canvas
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Get existing positions
        const positions = this.earth.geometry.attributes.position.array;
        const colors = [];

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            // Convert 3D position to UV coordinates
            const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
            const v = 0.5 - Math.asin(y / 1.5) / Math.PI;

            // Sample pixel color
            const px = Math.floor(u * canvas.width);
            const py = Math.floor(v * canvas.height);
            const index = (py * canvas.width + px) * 4;

            const red = imgData.data[index] / 255;
            const green = imgData.data[index + 1] / 255;
            const blue = imgData.data[index + 2] / 255;

            colors.push(red, green, blue);
        }

        // Update colors
        this.earth.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.earth.geometry.attributes.color.needsUpdate = true;
    }
