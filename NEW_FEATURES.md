# New Features Documentation

## Overview

This document describes all the new features added to the Emergency Personnel Performance Management System.

## 📋 Table of Contents

1. [Personnel Management Updates](#personnel-management-updates)
2. [Performance Monitoring Enhancements](#performance-monitoring-enhancements)
3. [Database Schema Changes](#database-schema-changes)

---

## 1. Personnel Management Updates

### 1.1 Split Name Fields

**Old Behavior:**
- Single "نام و نام خانوادگی" (Full Name) field

**New Behavior:**
- Separate fields:
  - **نام** (First Name) - Required
  - **نام خانوادگی** (Last Name) - Required

**Benefits:**
- Better data organization
- More accurate search and filtering
- Improved sorting capabilities
- Professional database structure

### 1.2 Work Experience Field

**New Field: سابقه کاری (Work Experience)**

- Type: Dropdown selection
- Options:
  1. **۰ تا ۴ سال** (0-4 years)
  2. **۴ تا ۸ سال** (4-8 years)
  3. **۸ تا ۱۲ سال** (8-12 years)
  4. **۱۲ تا ۱۶ سال** (12-16 years)
  5. **۱۶ سال به بالا** (16+ years)

**Usage:**
- Visible in personnel list table
- Editable in add/edit personnel modal
- Can be used for filtering in group assignment

---

## 2. Performance Monitoring Enhancements

### 2.1 Edit Mode with Click-to-Edit Shifts

**Features:**
- **View Mode** (🔒): Read-only display of performance data
- **Edit Mode** (🔓): Interactive editing enabled

**Click-to-Edit:**
1. Enable edit mode
2. Click on any cell in the table
3. Modal opens with shift selection options
4. Choose shift type (Work/Leave/Miscellaneous)
5. Select specific shift
6. Select base/station
7. Confirm to add shift

**Shift Types:**
- **شیفت کاری** (Work Shifts)
- **مرخصی** (Leave)
- **متفرقه** (Miscellaneous)

### 2.2 Action Buttons

**New Buttons:**

1. **🔒 حالت مشاهده / 🔓 حالت ویرایش** (View/Edit Mode Toggle)
   - Toggles between viewing and editing modes
   - Yellow background when in edit mode
   - Green background when in view mode

2. **💾 ذخیره موقت** (Temporary Save)
   - Saves changes as draft
   - Data can be edited again later
   - Only visible in edit mode

3. **✅ ذخیره نهایی** (Final Save)
   - Finalizes and submits data
   - Marks submission as complete
   - Switches back to view mode
   - Only visible in edit mode

4. **↩️ بازگشت** (Undo)
   - Reverts last change
   - Multiple undo levels supported
   - Only visible in edit mode

5. **↪️ جلو** (Redo)
   - Reapplies undone changes
   - Only visible in edit mode

### 2.3 Display Mode Options

**Three Display Modes:**

1. **فقط کد** (Code Only)
   - Shows only shift code
   - Minimal, compact view
   - Example: `K12`

2. **عنوان + کد** (Title + Code)  
   - Shows shift title and code
   - Balanced view
   - Example:
     ```
     شیفت صبح
     K12
     ```

3. **عنوان + کد + پایگاه** (Title + Code + Base)
   - Shows complete information
   - Full detail view
   - Example:
     ```
     شیفت صبح
     K12
     پایگاه ۱
     ```

**How to Change:**
- Select mode from dropdown in action bar
- Changes apply immediately
- Selection persists during session

### 2.4 Undo/Redo History

**Features:**
- **Multiple Undo Levels**: Can undo multiple changes in sequence
- **Redo Support**: Can reapply changes after undo
- **History Tracking**: Keeps track of all changes during session
- **Visual Feedback**: Buttons disabled when at history boundaries

**Usage:**
1. Make changes to the performance table
2. Click "↩️ بازگشت" to undo last change
3. Click "↪️ جلو" to redo undone change
4. History resets when applying new filter

### 2.5 Summary Columns

**New End Columns:**

1. **موظفی عملکرد** (Performance Duty)
   - Calculated field (to be implemented based on business rules)
   - Displays in blue

2. **جمع عملکرد ماهانه** (Monthly Performance Total)
   - Sum of all shift hours
   - Displays in blue

3. **مجموع مرخصی** (Leave Total)
   - Sum of all leave hours
   - Displays in orange

4. **مجموع تعطیلات** (Vacation Total)
   - Sum of holiday hours
   - Displays in red

5. **اضافه کار** (Overtime)
   - Sum of overtime hours
   - Displays in green

6. **تعداد مأموریت** (Mission Count)
   - Count of missions
   - Displays in purple

7. **تعداد وعده غذا** (Meal Count)
   - Count of meal vouchers
   - Displays in indigo

**Calculation Logic:**
- Automatically calculated from shift records
- Updates in real-time as shifts are added/removed
- Based on shift properties (type, hours, etc.)

### 2.6 Column Visibility Controls

**Hide/Show Columns:**
- Located below the performance table
- Toggle buttons for each summary column
- Visual indication:
  - 👁️ Blue background = Visible
  - 🔒 Gray background = Hidden

**Features:**
- Column visibility saved during session
- Can hide columns to reduce table width
- Essential columns (days) always visible
- Useful for focusing on specific metrics

### 2.7 Group Shift Assignment

**Advanced Feature for Bulk Operations**

**Access:**
- Click "تخصیص دسته جمعی" button
- Only visible in edit mode
- Shows count of selected personnel

**Two Selection Modes:**

#### A) Manual Selection (انتخاب دستی)

**Features:**
- Search box to find personnel by name
- Checkbox for each person
- "Select All" button for filtered results

**Process:**
1. Search for personnel (optional)
2. Check boxes next to desired personnel
3. Selected count updates dynamically

#### B) Filter-Based Selection (انتخاب فیلتری)

**Filter Options:**

1. **بهره‌وری** (Productivity)
   - All / Productive / Non-Productive

2. **استخدام** (Employment Status)
   - All / Official / Contractual

3. **سابقه کاری** (Work Experience)
   - All / 0-4 years / 4-8 years / 8-12 years / 12-16 years / 16+ years

**Additional Filters (To Be Implemented):**
- Based on assigned base
- Based on number of specific shift types
- Based on total hours
- Based on summary column values

**Process:**
1. Select "انتخاب فیلتری" mode
2. Set desired filters
3. All matching personnel automatically selected
4. Can still search to narrow down further

#### C) Shift Assignment Configuration

**Fields:**
1. **انتخاب شیفت** (Select Shift)
   - Dropdown of all available shifts
   - Shows title and code

2. **پایگاه** (Base/Station)
   - Dropdown of all bases
   - Shows name and number

3. **انتخاب روزها** (Select Days)
   - Enter days in flexible format:
     - Individual: `1,2,3,10`
     - Range: `5-10`
     - Mixed: `1,2,5-10,15,20-25`
   - Shows selected days below input

**Final Step:**
- Click "تخصیص گروهی" button
- Shifts assigned to all selected personnel for all selected days
- Modal closes
- Changes reflected in table immediately
- Added to undo history

**Use Cases:**
- Assign weekend shifts to all official personnel
- Assign leave to specific team
- Bulk scheduling for special events
- Quick setup for regular shift patterns

---

## 3. Database Schema Changes

### 3.1 New Fields in `personnel` Table

```sql
-- New columns added
first_name TEXT NOT NULL          -- First name (نام)
last_name TEXT                    -- Last name (نام خانوادگی)
work_experience TEXT              -- Work experience category
    CHECK (work_experience IN ('0-4', '4-8', '8-12', '12-16', '16+'))
```

### 3.2 Data Migration

**Automatic Migration:**
- Existing `name` field split into `first_name` and `last_name`
- First word → `first_name`
- Remaining words → `last_name`
- `name` field retained for backward compatibility

**Example:**
```
name: "محمد رضایی"
↓ After migration
first_name: "محمد"
last_name: "رضایی"
name: "محمد رضایی" (kept)
```

---

## Usage Guide

### For Supervisors (Base Managers)

1. **Adding Personnel:**
   - Go to "مدیریت پرسنل"
   - Click "افزودن پرسنل جدید"
   - Enter first name and last name separately
   - Select work experience category
   - Fill other required fields
   - Click "ذخیره"

2. **Editing Shifts:**
   - Go to "نظارت بر عملکرد"
   - Select month and year
   - Click "اعمال فیلتر"
   - Enable edit mode (🔓 button)
   - Click on cells to add/edit shifts
   - Use undo/redo as needed
   - Save temporarily or finalize

3. **Bulk Assignment:**
   - Select multiple personnel (checkboxes)
   - OR use filter-based selection
   - Click "تخصیص دسته جمعی"
   - Configure shift, base, and days
   - Click "تخصیص گروهی"

### For Administrators

1. **Monitoring Performance:**
   - Use different display modes for clarity
   - Hide/show columns based on focus area
   - Export or print reports
   - Review summary columns

2. **Data Analysis:**
   - Compare personnel performance
   - Track overtime patterns
   - Monitor leave usage
   - Analyze mission distribution

---

## Technical Notes

### Performance Optimizations

- **Memoization**: Used for expensive calculations
- **React.useMemo**: Optimized filtering and sorting
- **useCallback**: Prevented unnecessary re-renders
- **History Management**: Efficient deep cloning

### State Management

- **Local State**: Component-level state for UI
- **Context State**: Global personnel, shifts, bases data
- **History State**: Undo/redo functionality
- **Session State**: Display preferences

### Type Safety

- Full TypeScript implementation
- Type-safe API calls
- Validated form inputs
- Proper error handling

---

## Future Enhancements

### Planned Features

1. **Advanced Filters:**
   - Filter by base assignment
   - Filter by shift count
   - Filter by total hours
   - Filter by summary values

2. **Export Functionality:**
   - Export to Excel
   - Export to PDF
   - Export to CSV
   - Print-friendly views

3. **Reports:**
   - Monthly summary reports
   - Personnel performance reports
   - Base activity reports
   - Statistical analytics

4. **Notifications:**
   - Alert for low shift counts
   - Overtime warnings
   - Leave balance notifications
   - Missing data alerts

---

## Support

For questions or issues:

1. Check this documentation first
2. Review `DATABASE_MIGRATION_INSTRUCTIONS.md`
3. Check console for error messages
4. Contact system administrator

---

**Last Updated:** October 4, 2025
**Version:** 2.0
**Author:** AI Development Team
