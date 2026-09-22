import { defineConfig, loadEnv, Plugin } from 'vite';
import { handleChatRequest } from './api/chat';

function apiChatPlugin(mode: string): Plugin {
  return {
    name: 'api-chat-plugin',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        try {
          // Dynamically refresh environment variables from .env if updated
          const env = loadEnv(mode, process.cwd(), '');
          Object.assign(process.env, env);

          let rawBody = '';
          for await (const chunk of req) {
            rawBody += chunk;
          }
          const body = JSON.parse(rawBody || '{}');

          const result = await handleChatRequest(body);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [apiChatPlugin(mode)],
    server: {
      host: true,
      port: 5173,
      open: false
    },
    build: {
      target: 'esnext'
    }
  };
});
