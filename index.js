const express = require('express');
const { PrismaClient } = require('@prisma/client');
const IORedis = require('ioredis');

const app = express();
const port = 3000;

const prisma = new PrismaClient();

// Create a Redis client instance with the provided connection string
//const redisConnectionString = 'redis://default:redispw@localhost:55001';
const redisConnectionString = 'redis://redis:6379';
const redisClient = new IORedis(redisConnectionString);

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Middleware to cache responses using Redis
async function cacheMiddleware(req, res, next) {
  const key = req.originalUrl;

  try {
    const cachedData = await redisClient.get(key);

    if (cachedData !== null) {
      const parsedData = JSON.parse(cachedData);
      console.log("Found on redis")
      res.json(parsedData);
    } else {
      next();
    }
  } catch (error) {
    console.error('Error in cacheMiddleware:', error);
    next();
  }
}

// Product service using Prisma
class ProductService {
  async getProductById(productId) {
    return prisma.product.findUnique({ where: { id: productId } });
  }
}

const productService = new ProductService();

// Route to fetch and cache product by ID
app.get('/products/:id', cacheMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await productService.getProductById(productId);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Store data in Redis cache with a 2-minute expiration
    await redisClient.setex(req.originalUrl, 120, JSON.stringify(product));

    console.log("from db")
    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while fetching the product' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
