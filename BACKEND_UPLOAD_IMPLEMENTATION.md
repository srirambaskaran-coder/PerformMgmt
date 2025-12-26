# Backend Implementation for File Upload (PMS_backend branch)

This document provides the backend implementation for handling company logo uploads without S3.

## Overview
Files are stored locally on the server in an `uploads/logos/` directory and served via a static file endpoint.

## Implementation Steps

### 1. Install Required Dependencies

```bash
npm install multer uuid
npm install --save-dev @types/multer
```

### 2. Create Upload Configuration (src/config/upload.ts)

```typescript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid-timestamp.ext
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.'));
  }
};

// Configure multer
export const logoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

export const UPLOAD_DIR = uploadDir;
```

### 3. Create Upload Route (src/routes/companies.ts)

Add this route to your companies router:

```typescript
import express from 'express';
import { logoUpload } from '../config/upload';
import { authenticateJWT } from '../middleware/auth';
import path from 'path';

const router = express.Router();

// Upload logo endpoint
router.post(
  '/companies/upload-logo',
  authenticateJWT,
  logoUpload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate the public URL for the uploaded file
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const logoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;

      res.json({
        success: true,
        logoUrl,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ error: 'Failed to upload logo' });
    }
  }
);

export default router;
```

### 4. Serve Static Files (src/server.ts or app.ts)

Add this to your main server file to serve uploaded files:

```typescript
import express from 'express';
import path from 'path';

const app = express();

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ... rest of your server configuration
```

### 5. Update Environment Variables (.env)

```bash
# Base URL for generating file URLs
API_BASE_URL=http://localhost:3000
# For production:
# API_BASE_URL=https://api.yourdomain.com
```

### 6. Add Cleanup Service (Optional - src/services/cleanup.ts)

```typescript
import fs from 'fs';
import path from 'path';
import { db } from '../db';

/**
 * Clean up orphaned logo files that are no longer referenced in the database
 */
export async function cleanupOrphanedLogos() {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    const files = fs.readdirSync(uploadDir);
    
    // Get all logo URLs from database
    const companies = await db.query.companies.findMany({
      columns: { logoUrl: true },
    });
    
    const activeFiles = new Set(
      companies
        .map(c => c.logoUrl)
        .filter(Boolean)
        .map(url => path.basename(url!))
    );
    
    // Delete files not in database
    let deletedCount = 0;
    for (const file of files) {
      if (!activeFiles.has(file)) {
        fs.unlinkSync(path.join(uploadDir, file));
        deletedCount++;
      }
    }
    
    console.log(`Cleaned up ${deletedCount} orphaned logo files`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Run cleanup daily
setInterval(cleanupOrphanedLogos, 24 * 60 * 60 * 1000);
```

### 7. Update Company Delete Handler

When a company is deleted, also delete its logo file:

```typescript
router.delete('/companies/:id', authenticateJWT, async (req, res) => {
  try {
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, req.params.id),
    });
    
    if (company?.logoUrl) {
      // Delete the logo file
      const filename = path.basename(company.logoUrl);
      const filePath = path.join(process.cwd(), 'uploads', 'logos', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete company from database
    await db.delete(companies).where(eq(companies.id, req.params.id));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
});
```

## Security Considerations

1. **File Validation**: Only allowed image types (JPEG, PNG, GIF, WebP, SVG)
2. **File Size Limit**: Maximum 2MB per file
3. **Unique Filenames**: UUID + timestamp prevents conflicts
4. **Authentication**: Upload requires valid JWT token
5. **Directory Permissions**: Ensure proper file system permissions
6. **Sanitization**: File extensions are validated, not just MIME types

## Production Deployment

### Option 1: Same Server
- Store uploads on the same server
- Serve via Express static middleware
- **Pros**: Simple, no external dependencies
- **Cons**: Files lost if server is recreated, no CDN caching

### Option 2: Network File Storage (NFS)
- Mount shared storage (NFS, EFS, Azure Files)
- Multiple servers can access same files
- **Pros**: Scalable, persistent across deployments
- **Cons**: Slightly more complex setup

### Option 3: Object Storage (Future)
- Switch to cloud storage later if needed (S3, Azure Blob, Google Cloud Storage)
- Keep same API interface, just change storage backend
- **Pros**: Best for production at scale
- **Cons**: Additional cost and complexity

## Folder Structure

```
backend/
├── uploads/
│   └── logos/
│       ├── uuid1-timestamp1.png
│       ├── uuid2-timestamp2.jpg
│       └── ...
├── src/
│   ├── config/
│   │   └── upload.ts
│   ├── routes/
│   │   └── companies.ts
│   └── services/
│       └── cleanup.ts
└── .env
```

## Testing

```bash
# Test upload
curl -X POST http://localhost:3000/api/companies/upload-logo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logo=@/path/to/test-image.png"

# Expected response:
{
  "success": true,
  "logoUrl": "http://localhost:3000/uploads/logos/uuid-timestamp.png",
  "filename": "uuid-timestamp.png",
  "size": 12345
}

# Verify file access
curl http://localhost:3000/uploads/logos/uuid-timestamp.png
```

## Migration from S3 (if needed)

If you later want to move existing files:

```typescript
// Migration script
async function migrateToLocalStorage() {
  const companies = await db.query.companies.findMany();
  
  for (const company of companies) {
    if (company.logoUrl?.includes('s3.amazonaws.com')) {
      // Download from S3
      const response = await fetch(company.logoUrl);
      const buffer = await response.buffer();
      
      // Save locally
      const filename = `${uuidv4()}-${Date.now()}.${getExtFromUrl(company.logoUrl)}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      
      // Update database
      const newUrl = `${API_BASE_URL}/uploads/logos/${filename}`;
      await db.update(companies)
        .set({ logoUrl: newUrl })
        .where(eq(companies.id, company.id));
    }
  }
}
```

## Summary

This implementation provides:
- ✅ Local file storage (no S3 dependency)
- ✅ Production-ready with proper validation
- ✅ File size limits (2MB for logos)
- ✅ Secure upload with authentication
- ✅ Static file serving
- ✅ Cleanup mechanism for orphaned files
- ✅ Easy to migrate to cloud storage later

Frontend is already updated to use this new endpoint!
