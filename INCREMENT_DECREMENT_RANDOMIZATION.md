# Increment/Decrement Randomization Feature

## Overview

This feature introduces randomization to the increment and decrement field types in RPO GenData to prevent linear progression and create more realistic, non-linear data patterns while maintaining the overall upward or downward trend.

## Problem Statement

Currently, increment and decrement field types progress linearly:
- Start: 1000, Step: 100, Reset: 100000
- Sequence: 1000, 1100, 1200, 1300, 1400, 1500...

This predictable pattern doesn't simulate real-world scenarios where values typically fluctuate but follow general trends.

## Proposed Solution

Add a `randomization_percentage` parameter that introduces controlled randomness to each step while preserving the overall direction.

### Example Behavior
- **Configuration**: Start: 1000, Step: 100, Randomization: 15%, Reset: 100000
- **Possible Sequence**: 1000 → 1087 → 1194 → 1289 → 1423 → 1511...
- **Calculation**: Each step = `step ± (random_percentage * step)`

### Key Benefits
1. **Non-linear progression** while maintaining trend direction
2. **Realistic data simulation** for testing scenarios
3. **Configurable randomness** (0-100%)
4. **Backwards compatible** (defaults to 0% randomization)
5. **Works with existing reset logic and spike schedules**

## Technical Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 Database Migration
- Add `randomization_percentage` column to `fields` table
- Add `randomization_percentage` column to `spike_schedule_fields` table
- Create Alembic migration script
- Column type: FLOAT with default value 0.0

#### 1.2 Model Updates
- Update `backend/app/models/field.py`
- Update `backend/app/models/spike_schedule_field.py`
- Add `randomization_percentage = Column(Float, nullable=True, default=0.0)`

### Phase 2: Backend Logic Enhancement

#### 2.1 Value Generation Logic
**File: `backend/app/generators/value_generator.py`**

**Current Logic:**
```python
def _handle_increment(field: Field, db: Session) -> float:
    if field.current_number is None:
        current_value = field.start_number
        field.current_number = current_value + field.step_number
    else:
        current_value = field.current_number
        next_value = current_value + field.step_number
        # Reset logic...
```

**Enhanced Logic with Randomization:**
```python
def _handle_increment(field: Field, db: Session) -> float:
    if field.current_number is None:
        current_value = field.start_number
        randomized_step = self._apply_randomization(field.step_number, field.randomization_percentage)
        field.current_number = current_value + randomized_step
    else:
        current_value = field.current_number
        randomized_step = self._apply_randomization(field.step_number, field.randomization_percentage)
        next_value = current_value + randomized_step
        # Reset logic (check against trend direction)
```

**Randomization Helper Method:**
```python
def _apply_randomization(step: float, percentage: float) -> float:
    if not percentage or percentage <= 0:
        return step
    # Calculate random factor between -percentage and +percentage
    random_factor = random.uniform(-percentage/100, percentage/100)
    return step * (1 + random_factor)
```

#### 2.2 Validation Updates
- Update `validate_field_config()` to validate randomization_percentage (0-100)
- Add error messages for invalid percentage values

#### 2.3 Schema Updates
**File: `backend/app/schemas/field.py`**
- Add `randomization_percentage: Optional[float] = 0.0` to relevant schemas
- Update create and update field schemas

### Phase 3: API Endpoints Update

#### 3.1 Field Management APIs
**File: `backend/app/api/admin_collections.py`**
- Update field creation endpoint to handle `randomization_percentage`
- Update field update endpoint to handle new parameter
- Ensure proper validation and error handling

#### 3.2 Spike Schedule APIs
**File: `backend/app/api/admin_spike_schedules.py`**
- Update spike field creation/editing to include randomization
- Maintain separate randomization settings for spike periods

### Phase 4: Frontend UI Updates

#### 4.1 Field Management Interface
**File: `frontend/src/pages/CollectionDetail.tsx`**
- Add randomization percentage input field for INCREMENT/DECREMENT types
- Update form validation logic
- Display randomization info in field configuration summary

**UI Component:**
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700">
    Randomization Percentage (%)
  </label>
  <input
    type="number"
    step="0.1"
    min="0"
    max="100"
    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
    value={newField.randomization_percentage ?? 0}
    onChange={(e) => setNewField({...newField, randomization_percentage: parseFloat(e.target.value)})}
    placeholder="0 for no randomization"
  />
  <p className="mt-1 text-sm text-gray-500">
    Maximum percentage variation from step size (0-100%)
  </p>
</div>
```

#### 4.2 Spike Schedule Interface
**Files: `frontend/src/pages/CreateSpikeSchedule.tsx`, `EditSpikeSchedule.tsx`**
- Add randomization control for spike field configuration
- Allow independent randomization during spike periods

#### 4.3 TypeScript Interfaces
**File: `frontend/src/types/api.ts`**
- Update `CreateFieldRequest` interface
- Update `Field` interface
- Update spike-related interfaces

### Phase 5: Testing & Validation

#### 5.1 Unit Tests
- Test randomization logic with various percentages
- Verify reset behavior with random steps
- Test boundary conditions (0%, 100%, negative scenarios)

#### 5.2 Integration Tests
- Test API endpoints with new parameter
- Verify database persistence
- Test spike schedule interactions

#### 5.3 Edge Case Handling
- **Zero step with randomization**: Should remain at start value
- **Negative randomization impact**: Ensure overall trend is preserved
- **Precision handling**: Maintain float precision with calculations
- **Reset logic**: Base reset on trend direction, not individual random steps

## Technical Considerations

### Database Impact
- New column requires migration (affects existing deployments)
- Default value ensures backwards compatibility
- Indexing not required for this column

### Performance Considerations
- Random calculation adds minimal overhead
- Database transaction safety maintained with existing `db.flush()` pattern
- No additional queries required

### Race Conditions
- Current implementation already has potential race conditions with high-frequency access
- Randomization doesn't significantly impact this existing concern
- Future enhancement could implement row-level locking if needed

### Backwards Compatibility
- Existing fields default to 0% randomization (no change in behavior)
- API responses include new field (null/0 for existing fields)
- Frontend gracefully handles missing randomization values

## Validation Rules

### Randomization Percentage
- **Type**: Float
- **Range**: 0.0 to 100.0
- **Default**: 0.0 (no randomization)
- **Validation**: Must be non-negative, maximum 100%

### Reset Logic Considerations
- Reset threshold should be based on trend direction, not individual random steps
- For increments: Reset when average trend would exceed reset_number
- For decrements: Reset when average trend would fall below reset_number

## Example Scenarios

### Scenario 1: Basic Increment with Randomization
- **Configuration**: Start: 1000, Step: 100, Randomization: 20%
- **Possible Output**: 1000, 1183, 1276, 1394, 1489, 1612...

### Scenario 2: Decrement with Randomization
- **Configuration**: Start: 5000, Step: -50, Randomization: 10%
- **Possible Output**: 5000, 4953, 4898, 4847, 4792...

### Scenario 3: Spike Schedule Override
- **Normal**: Start: 1000, Step: 100, Randomization: 5%
- **Spike**: Start: 2000, Step: 200, Randomization: 50%
- **Behavior**: Uses spike configuration during active period, normal configuration otherwise

## Future Enhancements

### Potential Improvements
1. **Different randomization algorithms** (Gaussian, Poisson distribution)
2. **Trend preservation settings** (strict vs. loose trend adherence)
3. **Randomization boundaries** (min/max absolute values)
4. **Seasonal patterns** or time-based randomization factors

### Monitoring & Analytics
- Track randomization impact on data patterns
- Monitor reset frequency with randomization
- Analyze value distribution over time

## Deployment Notes

### Migration Strategy
1. Deploy database migration first (backwards compatible)
2. Deploy backend changes (handles null values gracefully)
3. Deploy frontend updates (new UI elements)
4. Enable feature through configuration

### Rollback Plan
- Database migration can be reversed if needed
- Backwards compatibility allows safe rollback
- Feature can be disabled by setting default randomization to 0%

## Conclusion

This enhancement provides significant value for creating more realistic test data while maintaining the simplicity and reliability of the existing increment/decrement system. The implementation is straightforward, backwards compatible, and provides configurable randomness that can be tuned based on specific testing requirements.