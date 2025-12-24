# Setting Up Vacancies in Contentful - Step-by-Step Guide

This guide walks you through setting up job vacancies in Contentful so you can add, edit, and delete them without touching code.

---

## Step 1: Create a Content Model in Contentful

1. **Log in to Contentful Dashboard**

   - Go to https://app.contentful.com
   - Select your space (e.g., "vortexpcs.com")

2. **Create a new Content Type**

   - In the left sidebar, click **Content model**
   - Click **+ Create content type**
   - Name: `Vacancy` (or `Job Opening`)
   - API ID: `vacancy` (Contentful will auto-populate; keep it simple)
   - Display field: Select "title" (we'll create this field)
   - Click **Create**

3. **Add Fields to the Vacancy Content Type**

   Add the following fields in order:

   | Field Name       | Type       | Required | Notes                                                |
   | ---------------- | ---------- | -------- | ---------------------------------------------------- |
   | **title**        | Short text | Yes      | E.g., "Senior Frontend Engineer"                     |
   | **level**        | Short text | Yes      | E.g., "Senior", "Mid", "Lead"                        |
   | **type**         | Short text | Yes      | E.g., "Full-time", "Contract / Part-time"            |
   | **location**     | Short text | Yes      | E.g., "Hybrid · Norwich / Remote UK"                 |
   | **summary**      | Long text  | Yes      | Job description (250 chars)                          |
   | **tags**         | JSON       | No       | Array of skill tags, e.g. `["React", "TypeScript"]`  |
   | **idealFor**     | JSON       | No       | Array of use cases, e.g. `["Web apps", "UI design"]` |
   | **displayOrder** | Integer    | No       | For sorting (lower = first)                          |
   | **featured**     | Boolean    | No       | Highlight this role (default: false)                 |

   **Field-by-field setup:**

   **a) title** (Short text)

   - Click **+ Add field**
   - Name: `title`
   - Type: Short text
   - Appearance: Single line
   - Validations: Required ✓
   - Save

   **b) level** (Short text)

   - Name: `level`
   - Type: Short text
   - Appearance: Single line
   - Validations: Required ✓
   - Save

   **c) type** (Short text)

   - Name: `type`
   - Type: Short text
   - Appearance: Single line
   - Validations: Required ✓
   - Save

   **d) location** (Short text)

   - Name: `location`
   - Type: Short text
   - Appearance: Single line
   - Validations: Required ✓
   - Save

   **e) summary** (Long text)

   - Name: `summary`
   - Type: Long text
   - Appearance: Multiple line
   - Validations: Required ✓
   - Save

   **f) tags** (JSON)

   - Name: `tags`
   - Type: JSON object
   - Appearance: JSON editor
   - Example value: `["React", "TypeScript", "shadcn/ui"]`
   - Save

   **g) idealFor** (JSON)

   - Name: `idealFor`
   - Type: JSON object
   - Appearance: JSON editor
   - Example value: `["Web development", "Performance optimization"]`
   - Save

   **h) displayOrder** (Integer)

   - Name: `displayOrder`
   - Type: Integer
   - Save

   **i) featured** (Boolean)

   - Name: `featured`
   - Type: Boolean
   - Save

4. **Publish the Content Type**
   - Click the green **Publish** button at the top

---

## Step 2: Create Job Vacancy Entries

1. **Go to Content**

   - In the left sidebar, click **Content**
   - Click **+ Create entry** (top right)
   - Select **Vacancy**

2. **Fill in the Job Details**

   - **title**: "Senior Frontend Engineer"
   - **level**: "Senior"
   - **type**: "Full-time"
   - **location**: "Hybrid · Norwich / Remote UK"
   - **summary**: "Lead premium UI delivery across our React + TypeScript stack..."
   - **tags**: `["React", "TypeScript", "shadcn/ui", "Vite"]`
   - **idealFor**: `["Frontend development", "Performance", "UX"]`
   - **displayOrder**: `1` (first job)
   - **featured**: `true` (if you want to highlight it)

3. **Publish the Entry**

   - Click the blue **Publish** button
   - The entry is now live and fetchable by the app

4. **Repeat for Other Roles**
   - Create entries for Backend, Customer Success, Content roles (or any you need)

---

## Step 3: Update the Vacancies Component to Fetch from Contentful

Now we need to modify `components/Vacancies.tsx` to pull data from Contentful instead of hardcoded roles.

1. **Add a Vacancy Interface to `services/cms.ts`**

   Add this after the existing interfaces (around line 200):

   ```typescript
   export interface Vacancy {
     id: string;
     title: string;
     level: string;
     type: string;
     location: string;
     summary: string;
     tags: string[];
     idealFor?: string[];
     displayOrder?: number;
     featured?: boolean;
   }
   ```

2. **Add Fetch Function to `services/cms.ts`**

   Add this function after `fetchBusinessWorkstations`:

   ```typescript
   /**
    * Fetch job vacancies from Contentful
    */
   export const fetchVacancies = async (params?: {
     featured?: boolean;
     limit?: number;
   }): Promise<Vacancy[]> => {
     if (!isContentfulEnabled || !contentfulClient) {
       return [];
     }

     try {
       const query: ContentfulQuery = {
         content_type: "vacancy",
         limit: params?.limit || 100,
         order: ["fields.displayOrder", "fields.title"] as unknown as string,
       };

       if (params?.featured !== undefined) {
         query["fields.featured"] = params.featured;
       }

       const response = await contentfulClient.getEntries(
         query as unknown as Record<string, unknown>
       );

       const vacancies = response.items.map((item) => {
         const fields = (item.fields || {}) as Record<string, unknown>;
         return {
           id: item.sys.id,
           title: getString(fields.title) ?? "",
           level: getString(fields.level) ?? "",
           type: getString(fields.type) ?? "",
           location: getString(fields.location) ?? "",
           summary: getString(fields.summary) ?? "",
           tags: Array.isArray(fields.tags) ? fields.tags : [],
           idealFor: Array.isArray(fields.idealFor) ? fields.idealFor : [],
           displayOrder: getNumber(fields.displayOrder),
           featured: getBoolean(fields.featured),
         };
       });

       return vacancies;
     } catch (error: unknown) {
       logger.error("Fetch vacancies error:", {
         error: error instanceof Error ? error.message : String(error),
       });
       return [];
     }
   };
   ```

   **Helper functions** (already exist in cms.ts, just for reference):

   - `getString(value)` – safely extracts string fields
   - `getNumber(value)` – safely extracts numbers
   - `getBoolean(value)` – safely extracts booleans

3. **Update `components/Vacancies.tsx`**

   Replace the hardcoded `roles` array at the top with a `useEffect` hook:

   ```typescript
   import { useState, useEffect } from "react";
   import { fetchVacancies, type Vacancy } from "../services/cms";
   import { logger } from "../services/logger";

   export function VacanciesPage() {
     const [roles, setRoles] = useState<Vacancy[]>([]);
     const [loadingRoles, setLoadingRoles] = useState(true);
     const [applicationOpen, setApplicationOpen] = useState(false);
     const [selectedRole, setSelectedRole] = useState<Vacancy | null>(null);
     // ... rest of your state

     useEffect(() => {
       const loadRoles = async () => {
         try {
           const vacancies = await fetchVacancies();
           setRoles(vacancies);
         } catch (error) {
           logger.error("Failed to load vacancies:", error);
           // Fall back to empty array or show error toast
         } finally {
           setLoadingRoles(false);
         }
       };
       loadRoles();
     }, []);

     // Rest of component...
   ```

4. **Update Type Reference**

   Change the `Role` type at the top to:

   ```typescript
   type Role = Vacancy;
   ```

---

## Step 4: Test in Development

1. **Add Vacancies in Contentful**

   - Create at least one vacancy entry in Contentful
   - Publish it

2. **Run the App Locally**

   ```bash
   npm run dev
   ```

3. **Check the Vacancies Page**

   - Navigate to `http://localhost:3000/vacancies`
   - You should see your Contentful vacancies loaded

4. **Check Console Logs**
   - Open DevTools (F12)
   - Look for success messages or errors related to fetching vacancies
   - If there are errors, verify:
     - Your Contentful API keys are set (`.env.local`)
     - The content type API ID is exactly `vacancy`
     - You published the entries (not just saved as draft)

---

## Step 5: Managing Vacancies Going Forward

### **To Add a New Role:**

1. Go to Contentful Content tab
2. Click **+ Create entry**
3. Select **Vacancy**
4. Fill in all fields (title, level, type, location, summary, tags)
5. Click **Publish**
6. Refresh your app—new role appears immediately (or within 5 minutes due to caching)

### **To Edit an Existing Role:**

1. Go to Contentful Content tab
2. Click the role entry
3. Edit the fields
4. Click **Publish**
5. Changes live within 5 minutes

### **To Delete a Role:**

1. Go to Contentful Content tab
2. Click the role entry
3. Click the **... (three dots)** menu → **Delete**
4. Confirm deletion
5. Role disappears from site within 5 minutes

### **To Reorder Roles:**

1. Edit the vacancy entry
2. Change the `displayOrder` field (1, 2, 3, etc.)
3. Publish
4. Page reloads to show new order

---

## Step 6: Optional Enhancements

### Add More Fields to Vacancies (e.g., Salary, Benefits)

1. Go to Content model → Vacancy
2. Click **+ Add field**
3. Add new field (e.g., `salaryRange`, `benefits` as Long text)
4. Update the `Vacancy` interface in `services/cms.ts`
5. Update the fetch function to extract the new fields
6. Update the UI to display them

### Cache Control

- By default, vacancies are cached for 5 minutes
- To clear cache immediately during development:
  ```javascript
  // In browser console
  import { clearCache } from "../services/cms";
  clearCache();
  ```

### Drafts and Publishing

- **Draft entries** are not fetched by the public app
- Always **Publish** entries to make them live
- Use **Preview** mode in Contentful to test drafts before publishing

---

## Troubleshooting

| Issue                              | Solution                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| Vacancies not showing              | Check Contentful API keys in `.env.local`; verify entries are **Published** (not draft) |
| "Fetch vacancies error" in console | Verify content type API ID is `vacancy` (lowercase)                                     |
| Old data showing                   | Clear browser cache or wait 5 minutes for cache to expire                               |
| Tags/idealFor not appearing        | Ensure they're valid JSON arrays in Contentful, e.g., `["Item1", "Item2"]`              |
| Can't create content type          | Verify you have **Editor** or **Admin** role in Contentful                              |

---

## Summary

You now have a full Contentful-powered vacancy system:

- ✅ Add roles via Contentful UI (no code deploy needed)
- ✅ Edit roles in real-time
- ✅ Delete roles instantly
- ✅ Reorder with `displayOrder` field
- ✅ Feature roles with `featured` flag
- ✅ Full job application modal with CV upload wired up

Questions? Refer back to this guide or check the `services/cms.ts` file for similar patterns (e.g., how `fetchBusinessWorkstations` works).
