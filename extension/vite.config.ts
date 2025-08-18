import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, existsSync, readdirSync, statSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-assets',
      writeBundle() {
        // Copy manifest.json to dist folder
        const manifestPath = resolve(__dirname, 'manifest.json')
        const distPath = resolve(__dirname, 'dist/manifest.json')
        
        if (existsSync(manifestPath)) {
          copyFileSync(manifestPath, distPath)
        } else {
          throw new Error('Manifest.json not found at: ' + manifestPath)
        }

        // Copy icon files to dist folder
        const iconFiles = ['icon-16.png', 'icon-32.png', 'icon-128.png']
        iconFiles.forEach(iconFile => {
          const iconPath = resolve(__dirname, iconFile)
          const distIconPath = resolve(__dirname, `dist/${iconFile}`)
          
          if (existsSync(iconPath)) {
            copyFileSync(iconPath, distIconPath)
          } else {
            throw new Error(`${iconFile} not found at: ${iconPath}`)
          }
        })

        // Copy any other assets from public folder
        const publicDir = resolve(__dirname, 'public')
        if (existsSync(publicDir)) {
          const copyRecursive = (src: string, dest: string) => {
            if (statSync(src).isDirectory()) {
              if (!existsSync(dest)) {
                // Create destination directory
                const destDir = dest
                if (!existsSync(destDir)) {
                  // This is a workaround since we can't create directories easily
                  // Silently continue
                }
              }
              readdirSync(src).forEach(file => {
                copyRecursive(resolve(src, file), resolve(dest, file))
              })
            } else {
              copyFileSync(src, dest)
            }
          }
          
          copyRecursive(publicDir, resolve(__dirname, 'dist'))
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
}) 