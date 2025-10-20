# Frontend Image Upload Integration Guide

## Overview

This guide explains how to integrate the image upload functionality into your TestForge frontend application.

---

## Components Created

### 1. ImageUpload Component
**Location:** `components/common/ImageUpload.jsx`

**Features:**
- ✅ Single and multiple file upload
- ✅ Image preview before upload
- ✅ Drag and drop support
- ✅ File size display
- ✅ Compression ratio display
- ✅ Delete uploaded images
- ✅ 100% Mobile responsive
- ✅ Loading states
- ✅ Error handling

**Usage:**
```jsx
import ImageUpload from '@/components/common/ImageUpload';

<ImageUpload
  entityType="case" // 'case' | 'feedback' | 'feature' | 'organization' | 'user' | 'session'
  entityId={caseId}
  orgId={organizationId}
  multiple={true}
  maxFiles={10}
  onUploadSuccess={(images) => console.log('Uploaded:', images)}
  existingImages={[]} // Array of existing images
  className="mt-4"
/>
```

### 2. Pricing Page
**Location:** `app/pricing/page.jsx`

**Features:**
- ✅ All 5 pricing tiers displayed
- ✅ Monthly/Annual toggle with 20% discount
- ✅ Feature comparison
- ✅ Usage limits clearly shown
- ✅ FAQ section
- ✅ CTA sections
- ✅ Fully responsive (mobile-first)
- ✅ Gradient backgrounds
- ✅ Smooth animations

**Access:** Navigate to `/pricing`

### 3. BillingSection Component
**Location:** `components/orgs/BillingSection.jsx`

**Features:**
- ✅ Current plan display
- ✅ Usage statistics (Storage, Bandwidth, Uploads)
- ✅ Progress bars with color coding
- ✅ Warning alerts at 80%+ usage
- ✅ Billing cycle information
- ✅ Upgrade button
- ✅ Mobile responsive

**Usage:**
```jsx
import BillingSection from '@/components/orgs/BillingSection';

<BillingSection orgId={organizationId} />
```

---

## Integration Steps

### Step 1: Add Image Upload to Test Cases

**Edit:** `app/cases/[caseId]/page.jsx`

```jsx
import ImageUpload from '@/components/common/ImageUpload';

// Inside your component, after the case details section:
<Card className="mt-6">
  <CardHeader>
    <CardTitle>Test Evidence</CardTitle>
    <CardDescription>
      Upload screenshots or images related to this test case
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ImageUpload
      entityType="case"
      entityId={caseId}
      orgId={currentCase?.featureId?.sessionId?.orgId} // Get from case data
      multiple={true}
      maxFiles={10}
      onUploadSuccess={(images) => {
        console.log('Images uploaded:', images);
        // Optionally refresh case data
      }}
    />
  </CardContent>
</Card>
```

### Step 2: Add Image Upload to Feedback

**Edit:** `app/cases/[caseId]/page.jsx` (feedback form section)

```jsx
// In the feedback submission form dialog:
<DialogContent className="max-w-2xl">
  <DialogHeader>
    <DialogTitle>Submit Feedback</DialogTitle>
  </DialogHeader>

  {/* Existing feedback form fields */}

  {/* Add image upload */}
  <div className="mt-4">
    <Label>Evidence (Optional)</Label>
    <ImageUpload
      entityType="feedback"
      entityId={feedbackId} // Set after feedback is created
      orgId={orgId}
      multiple={true}
      maxFiles={5}
    />
  </div>
</DialogContent>
```

### Step 3: Add Image Upload to Features

**Location:** Feature detail or create feature form

```jsx
<ImageUpload
  entityType="feature"
  entityId={featureId}
  orgId={orgId}
  multiple={true}
  maxFiles={5}
/>
```

### Step 4: Add Billing Section to Organization Settings

**Create:** `app/orgs/[orgId]/settings/page.jsx` or add to existing org detail page

```jsx
import BillingSection from '@/components/orgs/BillingSection';

export default function OrganizationSettingsPage() {
  const params = useParams();
  const orgId = params.orgId;

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Organization Settings</h1>

        {/* Other settings tabs */}

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Billing & Usage</h2>
          <BillingSection orgId={orgId} />
        </div>
      </div>
    </AppLayout>
  );
}
```

### Step 5: Add Pricing Link to Navigation

**Edit:** `components/layout/app-layout.jsx` or your navigation component

```jsx
<nav>
  <Link href="/orgs">Organizations</Link>
  <Link href="/pricing">Pricing</Link>
  <Link href="/profile">Profile</Link>
</nav>
```

---

## API Configuration

### Update API Base URL

**Edit:** `lib/realApi.js` (if using real API)

```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
```

### Add Image Upload Redux Slice (Optional)

**Create:** `lib/slices/imagesSlice.js`

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const uploadImage = createAsyncThunk(
  'images/upload',
  async ({ file, entityType, entityId, orgId }) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('orgId', orgId);

    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  }
);

export const fetchEntityImages = createAsyncThunk(
  'images/fetchEntity',
  async ({ entityType, entityId }) => {
    const response = await fetch(
      `${API_BASE_URL}/images/${entityType}/${entityId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  }
);

const imagesSlice = createSlice({
  name: 'images',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(uploadImage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(uploadImage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list.push(action.payload.image);
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchEntityImages.fulfilled, (state, action) => {
        state.list = action.payload;
      });
  },
});

export default imagesSlice.reducer;
```

---

## Mobile Responsiveness Details

All components are built mobile-first with responsive breakpoints:

### Breakpoints Used:
- **Mobile**: Default (< 640px)
- **sm**: 640px (small tablets)
- **md**: 768px (tablets)
- **lg**: 1024px (laptops)
- **xl**: 1280px (desktops)

### Responsive Features:

**ImageUpload Component:**
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Padding: `p-4 md:p-6`
- Text: `text-xs md:text-sm`
- Image height: `h-32 md:h-40`

**Pricing Page:**
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`
- Heading: `text-3xl md:text-4xl lg:text-5xl`
- Padding: `py-8 md:py-12 px-4`
- Button text: `text-sm md:text-base`

**BillingSection:**
- Grid: `grid-cols-1 md:grid-cols-3`
- Flex direction: `flex-col sm:flex-row`
- Button width: `w-full sm:w-auto`
- Text sizes: `text-xs md:text-sm md:text-base`

---

## Usage Limits by Plan

| Plan | Storage | Bandwidth | Uploads/Month | Max File Size |
|------|---------|-----------|---------------|---------------|
| Free | 0 MB | 0 GB | 0 | 2 MB |
| Starter | 500 MB | 5 GB | 1,000 | 5 MB |
| Professional | 5 GB | 50 GB | 10,000 | 10 MB |
| Business | 50 GB | 500 GB | 100,000 | 25 MB |
| Enterprise | Custom | Custom | Unlimited | 100 MB |

---

## Error Handling

The ImageUpload component handles these errors:
- Invalid file types (only images allowed)
- File size exceeds org limits
- Upload quota exceeded
- Network errors
- Authentication errors

All errors display as toast notifications to the user.

---

## Testing Checklist

- [ ] Upload single image to test case
- [ ] Upload multiple images to test case
- [ ] Upload images to feedback
- [ ] Delete uploaded image
- [ ] View image in new tab
- [ ] Check usage statistics update after upload
- [ ] Test on mobile device (or Chrome DevTools mobile view)
- [ ] Test on tablet size
- [ ] Verify pricing page displays correctly
- [ ] Check billing section shows accurate usage
- [ ] Test upgrade request flow
- [ ] Verify warnings appear at 80%+ usage

---

## Quick Start

1. **Navigate to Pricing:**
   ```
   http://localhost:3000/pricing
   ```

2. **Create Test Case and Upload Image:**
   - Go to any test case detail page
   - Scroll to "Test Evidence" section
   - Click upload or drag & drop image
   - Click "Upload" button

3. **Check Billing:**
   - Go to organization settings
   - View "Billing & Usage" section
   - See storage/bandwidth/uploads usage

---

## Future Enhancements

- [ ] Drag and drop files directly onto upload area
- [ ] Image editing capabilities (crop, rotate)
- [ ] Video upload support
- [ ] Bulk image download
- [ ] Image gallery view
- [ ] Automated Stripe payment integration
- [ ] Real-time usage notifications
- [ ] Advanced image search/filter
- [ ] Image annotations/markup

---

## Troubleshooting

### Images not uploading
1. Check browser console for errors
2. Verify API_BASE_URL is correct
3. Ensure authToken is valid
4. Check organization has active billing plan
5. Verify file size within limits

### Pricing page not loading
1. Check `/api/billing/plans` endpoint is accessible
2. Verify backend is running
3. Check browser console for fetch errors

### Usage statistics not updating
1. Allow a few seconds for database update
2. Refresh the page
3. Check backend logs for errors
4. Verify billing record exists for organization

---

## Support

For issues:
1. Check browser console
2. Check backend logs
3. Verify all environment variables set
4. Test API endpoints with Postman
5. Ensure storage accounts are seeded

---

## Summary

You now have:
- ✅ Fully functional image upload system
- ✅ Beautiful, responsive pricing page
- ✅ Usage tracking and billing management
- ✅ Mobile-first design across all components
- ✅ Error handling and loading states
- ✅ Integration-ready components

Deploy and test! 🚀
