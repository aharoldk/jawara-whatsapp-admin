import Joi from 'joi';
import Boom from '@hapi/boom';
import axios from 'axios';
import Config from '../models/Config.js';

const n8nHttp = axios.create({
  baseURL: process.env.N8N_BASE_URL ?? 'http://localhost:5678',
  auth: {
    username: process.env.N8N_BASIC_AUTH_USER ?? '',
    password: process.env.N8N_BASIC_AUTH_PASSWORD ?? '',
  },
});

const QDRANT_BASE_URL = process.env.QDRANT_BASE_URL ?? 'http://localhost:6333';
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? 'business-docs';

const configRoute = {
  name: 'config',
  version: '1.0.0',
  register(server) {
    // GET /config — return current config
    server.route({
      method: 'GET',
      path: '/config',
      async handler() {
        const config = await Config.findById('main').lean();
        return config ?? { _id: 'main', knowledgeBase: '' };
      },
    });

    // PUT /config — save config, wipe Qdrant collection, re-index knowledge base
    server.route({
      method: 'PUT',
      path: '/config',
      options: {
        validate: {
          payload: Joi.object({
            knowledgeBase: Joi.string().allow('').required(),
          }),
        },
      },
      async handler(request) {
        const { knowledgeBase } = request.payload;

        // 1. Persist to MongoDB
        const config = await Config.findByIdAndUpdate(
          'main',
          { $set: { knowledgeBase } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();

        // 2. Delete all points from the Qdrant collection (clear old knowledge)
        try {
          await axios.post(
            `${QDRANT_BASE_URL}/collections/${QDRANT_COLLECTION}/points/delete`,
            { filter: {} },
          );
        } catch (err) {
          // If collection doesn't exist yet, continue
          const status = err.response?.status;
          if (status !== 404) {
            throw Boom.badGateway(
              `Qdrant error clearing collection: ${err.response?.data?.status?.error ?? err.message}`,
            );
          }
        }

        // 3. Re-index the new knowledge base text via n8n (skip if empty)
        if (knowledgeBase.trim()) {
          const webhookPath = process.env.N8N_INDEX_WEBHOOK ?? '/webhook-test/index-docs';
          try {
            await n8nHttp.post(webhookPath, {
              filename: 'knowledge-base.txt',
              text: knowledgeBase,
            });
          } catch (err) {
            throw Boom.badGateway(
              `n8n indexing error: ${err.response?.data?.message ?? err.message}`,
            );
          }
        }

        return config;
      },
    });
  },
};

export default configRoute;
