import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{watch:{usePolling:true,interval:500,ignored:['**/.codex/**','**/dist/**','**/deleteme/**','**/public/source/**']}},build:{emptyOutDir:false,rollupOptions:{output:{manualChunks:{'react-vendor':['react','react-dom','react-dom/client'],markdown:['react-markdown']}}}}});
