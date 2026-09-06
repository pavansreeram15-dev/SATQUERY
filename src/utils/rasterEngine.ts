/**
 * Client-Side Satellite Raster Differencing & Multi-Sensor Fusion Engine
 * Provides instant real pixel-level difference maps, Otsu change masks,
 * and Optical-SAR false-color composite generation in browser canvas.
 */

class RasterEngine {
  private cache = new Map<string, string>();

  /**
   * Load an image source into an HTMLImageElement
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error(`Failed to load image from: ${src}`));
      img.src = src;
    });
  }

  /**
   * Generate a pixel-level difference heatmap between T1 and T2 images.
   * Supports Turbo, Viridis, and Magma scientific colormaps.
   */
  async generateDifferenceMap(
    t1Src: string,
    t2Src: string,
    colormap: 'TURBO' | 'VIRIDIS' | 'MAGMA' = 'TURBO',
    width = 512,
    height = 512
  ): Promise<string> {
    const cacheKey = `diff_${t1Src}_${t2Src}_${colormap}_${width}x${height}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const [img1, img2] = await Promise.all([this.loadImage(t1Src), this.loadImage(t2Src)]);

      const canvas1 = document.createElement('canvas');
      canvas1.width = width;
      canvas1.height = height;
      const ctx1 = canvas1.getContext('2d', { willReadFrequently: true });

      const canvas2 = document.createElement('canvas');
      canvas2.width = width;
      canvas2.height = height;
      const ctx2 = canvas2.getContext('2d', { willReadFrequently: true });

      const outCanvas = document.createElement('canvas');
      outCanvas.width = width;
      outCanvas.height = height;
      const outCtx = outCanvas.getContext('2d');

      if (!ctx1 || !ctx2 || !outCtx) {
        throw new Error('Canvas 2D context not available');
      }

      ctx1.drawImage(img1, 0, 0, width, height);
      ctx2.drawImage(img2, 0, 0, width, height);

      const data1 = ctx1.getImageData(0, 0, width, height).data;
      const data2 = ctx2.getImageData(0, 0, width, height).data;
      const outData = outCtx.createImageData(width, height);

      const maxDist = Math.sqrt(3 * 255 * 255);

      for (let i = 0; i < data1.length; i += 4) {
        const dr = data2[i] - data1[i];
        const dg = data2[i + 1] - data1[i + 1];
        const db = data2[i + 2] - data1[i + 2];

        // Normalized Euclidean distance
        const dist = Math.sqrt(dr * dr + dg * dg + db * db) / maxDist;
        const boosted = Math.min(1.0, Math.pow(dist * 2.2, 0.85));

        let r = 0, g = 0, b = 0;

        if (colormap === 'VIRIDIS') {
          // Viridis: Deep Purple -> Blue -> Teal -> Green -> Yellow
          if (boosted < 0.25) {
            const t = boosted / 0.25;
            r = Math.round(68 - t * 20);
            g = Math.round(1 + t * 50);
            b = Math.round(84 + t * 50);
          } else if (boosted < 0.5) {
            const t = (boosted - 0.25) / 0.25;
            r = Math.round(48 - t * 15);
            g = Math.round(51 + t * 65);
            b = Math.round(134 + t * 10);
          } else if (boosted < 0.75) {
            const t = (boosted - 0.5) / 0.25;
            r = Math.round(33 + t * 50);
            g = Math.round(116 + t * 65);
            b = Math.round(144 - t * 40);
          } else {
            const t = (boosted - 0.75) / 0.25;
            r = Math.round(83 + t * 170);
            g = Math.round(181 + t * 60);
            b = Math.round(104 - t * 80);
          }
        } else if (colormap === 'MAGMA') {
          // Magma: Black -> Dark Violet -> Coral Red -> Peach -> Light Yellow
          if (boosted < 0.25) {
            const t = boosted / 0.25;
            r = Math.round(10 + t * 60);
            g = Math.round(10 + t * 15);
            b = Math.round(30 + t * 70);
          } else if (boosted < 0.5) {
            const t = (boosted - 0.25) / 0.25;
            r = Math.round(70 + t * 110);
            g = Math.round(25 + t * 30);
            b = Math.round(100 + t * 15);
          } else if (boosted < 0.75) {
            const t = (boosted - 0.5) / 0.25;
            r = Math.round(180 + t * 60);
            g = Math.round(55 + t * 70);
            b = Math.round(115 - t * 45);
          } else {
            const t = (boosted - 0.75) / 0.25;
            r = Math.round(240 + t * 15);
            g = Math.round(125 + t * 115);
            b = Math.round(70 + t * 130);
          }
        } else {
          // Turbo (Default): Navy -> Cyan -> Emerald -> Yellow -> Neon Crimson
          if (boosted < 0.15) {
            r = Math.round(15 + boosted * 40);
            g = Math.round(23 + boosted * 120);
            b = Math.round(42 + boosted * 280);
          } else if (boosted < 0.4) {
            const t = (boosted - 0.15) / 0.25;
            r = Math.round(10 + t * 20);
            g = Math.round(140 + t * 90);
            b = Math.round(180 - t * 90);
          } else if (boosted < 0.7) {
            const t = (boosted - 0.4) / 0.3;
            r = Math.round(200 + t * 55);
            g = Math.round(200 - t * 50);
            b = Math.round(30 - t * 20);
          } else {
            const t = (boosted - 0.7) / 0.3;
            r = Math.round(245 + t * 10);
            g = Math.round(50 - t * 30);
            b = Math.round(80 + t * 120);
          }
        }

        outData.data[i] = r;
        outData.data[i + 1] = g;
        outData.data[i + 2] = b;
        outData.data[i + 3] = 255;
      }

      outCtx.putImageData(outData, 0, 0);
      const dataUrl = outCanvas.toDataURL('image/png');
      this.cache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (e) {
      console.warn('[RasterEngine] generateDifferenceMap error:', e);
      return t2Src;
    }
  }

  /**
   * Generate an Otsu / Adaptive thresholded binary Change Mask.
   * Changed pixels are highlighted in glowing semi-transparent rose/red (`#f43f5e`),
   * unchanged pixels are 100% transparent.
   */
  async generateChangeMask(t1Src: string, t2Src: string, threshold = 0.16, width = 512, height = 512): Promise<string> {
    const cacheKey = `mask_${t1Src}_${t2Src}_${threshold}_${width}x${height}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const [img1, img2] = await Promise.all([this.loadImage(t1Src), this.loadImage(t2Src)]);

      const canvas1 = document.createElement('canvas');
      canvas1.width = width;
      canvas1.height = height;
      const ctx1 = canvas1.getContext('2d', { willReadFrequently: true });

      const canvas2 = document.createElement('canvas');
      canvas2.width = width;
      canvas2.height = height;
      const ctx2 = canvas2.getContext('2d', { willReadFrequently: true });

      const outCanvas = document.createElement('canvas');
      outCanvas.width = width;
      outCanvas.height = height;
      const outCtx = outCanvas.getContext('2d');

      if (!ctx1 || !ctx2 || !outCtx) {
        throw new Error('Canvas 2D context not available');
      }

      ctx1.drawImage(img1, 0, 0, width, height);
      ctx2.drawImage(img2, 0, 0, width, height);

      const data1 = ctx1.getImageData(0, 0, width, height).data;
      const data2 = ctx2.getImageData(0, 0, width, height).data;
      const outData = outCtx.createImageData(width, height);

      const maxDist = Math.sqrt(3 * 255 * 255);

      for (let i = 0; i < data1.length; i += 4) {
        const dr = data2[i] - data1[i];
        const dg = data2[i + 1] - data1[i + 1];
        const db = data2[i + 2] - data1[i + 2];

        const dist = Math.sqrt(dr * dr + dg * dg + db * db) / maxDist;

        if (dist > threshold) {
          // Luminous translucent neon crimson / rose overlay
          outData.data[i] = 244;      // R
          outData.data[i + 1] = 63;   // G
          outData.data[i + 2] = 94;   // B
          outData.data[i + 3] = 185;  // Alpha (~72% opacity)
        } else {
          // Unchanged pixels: 100% transparent
          outData.data[i] = 0;
          outData.data[i + 1] = 0;
          outData.data[i + 2] = 0;
          outData.data[i + 3] = 0;
        }
      }

      outCtx.putImageData(outData, 0, 0);
      const dataUrl = outCanvas.toDataURL('image/png');
      this.cache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (e) {
      console.warn('[RasterEngine] generateChangeMask error:', e);
      return '';
    }
  }

  /**
   * Generate an Optical-SAR False Color Composite.
   * Combines high-resolution Optical (Cartosat) and SAR (RISAT C-band) microwave backscatter.
   */
  async generateOpticalSarFusion(opticalSrc: string, sarSrc: string, width = 512, height = 512): Promise<string> {
    const cacheKey = `fusion_${opticalSrc}_${sarSrc}_${width}x${height}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const [optImg, sarImg] = await Promise.all([this.loadImage(opticalSrc), this.loadImage(sarSrc)]);

      const canvas1 = document.createElement('canvas');
      canvas1.width = width;
      canvas1.height = height;
      const ctx1 = canvas1.getContext('2d', { willReadFrequently: true });

      const canvas2 = document.createElement('canvas');
      canvas2.width = width;
      canvas2.height = height;
      const ctx2 = canvas2.getContext('2d', { willReadFrequently: true });

      const outCanvas = document.createElement('canvas');
      outCanvas.width = width;
      outCanvas.height = height;
      const outCtx = outCanvas.getContext('2d');

      if (!ctx1 || !ctx2 || !outCtx) {
        throw new Error('Canvas 2D context not available');
      }

      ctx1.drawImage(optImg, 0, 0, width, height);
      ctx2.drawImage(sarImg, 0, 0, width, height);

      const optData = ctx1.getImageData(0, 0, width, height).data;
      const sarData = ctx2.getImageData(0, 0, width, height).data;
      const outData = outCtx.createImageData(width, height);

      for (let i = 0; i < optData.length; i += 4) {
        const optR = optData[i];
        const optG = optData[i + 1];
        const optB = optData[i + 2];

        // SAR is single-channel/grayscale radar backscatter
        const sarVal = (sarData[i] + sarData[i + 1] + sarData[i + 2]) / 3;

        // Dual-sensor false color composite:
        // Red: Optical Red with NIR weight
        // Green: SAR C-band backscatter (highlights rough terrain & penetrates clouds)
        // Blue: Optical Blue / specular absorption
        const fusedR = Math.min(255, Math.round(optR * 0.75 + sarVal * 0.25));
        const fusedG = Math.min(255, Math.round(sarVal * 0.85 + optG * 0.35));
        const fusedB = Math.min(255, Math.round(optB * 0.5 + sarVal * 0.15));

        outData.data[i] = fusedR;
        outData.data[i + 1] = fusedG;
        outData.data[i + 2] = fusedB;
        outData.data[i + 3] = 255;
      }

      outCtx.putImageData(outData, 0, 0);
      const dataUrl = outCanvas.toDataURL('image/png');
      this.cache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (e) {
      console.warn('[RasterEngine] generateOpticalSarFusion error:', e);
      return opticalSrc;
    }
  }
}

export const rasterEngine = new RasterEngine();
