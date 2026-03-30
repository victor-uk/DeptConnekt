# Troubleshooting Test Setup

## MongoDB Memory Server Download Issues

If you're encountering download errors when running tests, here are several solutions:

### Solution 1: Use System MongoDB (Recommended for Local Development)

If you have MongoDB installed locally, you can bypass MongoDB Memory Server entirely:

1. **Set environment variable:**
   ```bash
   # Windows (PowerShell)
   $env:MONGO_URI_TEST="mongodb://localhost:27017/jest-test-db"
   
   # Windows (CMD)
   set MONGO_URI_TEST=mongodb://localhost:27017/jest-test-db
   
   # Linux/Mac
   export MONGO_URI_TEST="mongodb://localhost:27017/jest-test-db"
   ```

2. **Or create a `.env.test` file:**
   ```
   MONGO_URI_TEST=mongodb://localhost:27017/jest-test-db
   ```

3. **Make sure MongoDB is running:**
   ```bash
   # Check if MongoDB is running
   mongod --version
   ```

### Solution 2: Pre-download MongoDB Binary

1. **Set cache directory:**
   ```bash
   # Windows
   set MONGOMS_CACHE_PATH=%USERPROFILE%\.cache\mongodb-binaries
   
   # Linux/Mac
   export MONGOMS_CACHE_PATH=~/.cache/mongodb-binaries
   ```

2. **Download manually or let it retry when network is available**

### Solution 3: Use Docker (Alternative)

If you have Docker installed:

1. **Run MongoDB in Docker:**
   ```bash
   docker run -d -p 27017:27017 --name test-mongo mongo:7.0
   ```

2. **Set environment variable:**
   ```bash
   set MONGO_URI_TEST=mongodb://localhost:27017/jest-test-db
   ```

### Solution 4: Configure Proxy (If behind corporate firewall)

If you're behind a corporate firewall:

1. **Set proxy environment variables:**
   ```bash
   set HTTP_PROXY=http://proxy.company.com:8080
   set HTTPS_PROXY=http://proxy.company.com:8080
   ```

2. **Or configure in test setup:**
   ```javascript
   process.env.HTTP_PROXY = 'http://proxy.company.com:8080'
   process.env.HTTPS_PROXY = 'http://proxy.company.com:8080'
   ```

### Solution 5: Skip Binary Download (Use System MongoDB)

Modify `__tests__/setup/testSetup.js` to always use system MongoDB:

```javascript
export const connectDB = async () => {
  const testMongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/jest-test-db'
  await mongoose.connect(testMongoUri)
}
```

### Solution 6: Use Different MongoDB Memory Server Version

Sometimes older versions work better:

```bash
npm install mongodb-memory-server@9.1.3 --save-dev
```

## Common Errors

### Error: `getaddrinfo ENOTFOUND fastdl.mongodb.org`
- **Cause**: DNS resolution failure or network connectivity issues
- **Solution**: Use system MongoDB (Solution 1) or check network/firewall settings

### Error: `Download failed for url`
- **Cause**: Network timeout or connection reset
- **Solution**: Use system MongoDB (Solution 1) or configure proxy (Solution 4)

### Error: `ECONNRESET`
- **Cause**: Connection reset by server, often due to firewall
- **Solution**: Use system MongoDB (Solution 1) or check firewall settings

## Recommended Setup for CI/CD

For continuous integration, it's often better to use a real MongoDB instance:

```yaml
# GitHub Actions example
services:
  mongodb:
    image: mongo:7.0
    ports:
      - 27017:27017
env:
  MONGO_URI_TEST: mongodb://localhost:27017/jest-test-db
```

## Verification

After applying a solution, verify it works:

```bash
npm test
```

The tests should connect successfully without download errors.

