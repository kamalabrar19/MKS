import {defineConfig,loadEnv} from 'vite';
import {createSummaryMiddleware} from './server/middleware.js';

export default defineConfig(({mode})=>{
  // No VITE_ prefix: credentials are loaded exclusively in the local Node process.
  const env=loadEnv(mode,process.cwd(),'GEMINI_');
  const middleware=createSummaryMiddleware({apiKey:process.env.GEMINI_API_KEY||env.GEMINI_API_KEY});
  return {
    server:{host:'127.0.0.1',port:5173,strictPort:true,cors:false},
    preview:{host:'127.0.0.1',port:4173,strictPort:true,cors:false},
    plugins:[{name:'local-gemini-summary',configureServer(server){server.middlewares.use(middleware)},configurePreviewServer(server){server.middlewares.use(middleware)}}]
  };
});
