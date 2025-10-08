import time
import random
from typing import Union, Any
from sqlalchemy.orm import Session
from app.models.field import Field, ValueType

class ValueGenerator:
    @staticmethod
    def generate_value(field: Field, db: Session) -> Union[int, float, str]:
        """Generate a value based on the field's configuration."""
        
        if field.value_type == ValueType.TEXT_FIXED:
            return field.fixed_value_text
        
        elif field.value_type == ValueType.NUMBER_FIXED:
            return field.fixed_value_number
        
        elif field.value_type == ValueType.FLOAT_FIXED:
            return field.fixed_value_float
        
        elif field.value_type == ValueType.EPOCH_NOW:
            return int(time.time())
        
        elif field.value_type == ValueType.NUMBER_RANGE:
            return random.randint(field.range_start_number, field.range_end_number)
        
        elif field.value_type == ValueType.FLOAT_RANGE:
            value = random.uniform(field.range_start_float, field.range_end_float)
            precision = field.float_precision or 2
            return round(value, precision)
        
        elif field.value_type == ValueType.INCREMENT:
            return ValueGenerator._handle_increment(field, db)
        
        elif field.value_type == ValueType.DECREMENT:
            return ValueGenerator._handle_decrement(field, db)
        
        else:
            raise ValueError(f"Unknown value type: {field.value_type}")
    
    @staticmethod
    def _handle_increment(field: Field, db: Session) -> float:
        """Handle INCREMENT value generation with persistence."""
        # If current is NULL, set to start and return it
        if field.current_number is None:
            current_value = field.start_number
            field.current_number = current_value + field.step_number
        else:
            # Return current value and calculate next
            current_value = field.current_number
            next_value = current_value + field.step_number
            
            # Check if next value exceeds reset threshold
            if next_value > field.reset_number:
                # Reset: next call should return start_number
                field.current_number = field.start_number
            else:
                field.current_number = next_value
        
        db.flush()
        return current_value
    
    @staticmethod
    def _handle_decrement(field: Field, db: Session) -> float:
        """Handle DECREMENT value generation with persistence."""
        # If current is NULL, set to start and return it
        if field.current_number is None:
            current_value = field.start_number
            field.current_number = current_value - field.step_number
        else:
            # Return current value and calculate next
            current_value = field.current_number
            next_value = current_value - field.step_number
            
            # Check if next value falls below reset threshold
            if next_value < field.reset_number:
                # Reset: next call should return start_number
                field.current_number = field.start_number
            else:
                field.current_number = next_value
        
        db.flush()
        return current_value

    @staticmethod
    def validate_field_config(field: Field) -> list[str]:
        """Validate field configuration and return list of errors."""
        errors = []
        
        if field.value_type == ValueType.TEXT_FIXED:
            if not field.fixed_value_text:
                errors.append("fixed_value_text is required for TEXT_FIXED")
        
        elif field.value_type == ValueType.NUMBER_FIXED:
            if field.fixed_value_number is None:
                errors.append("fixed_value_number is required for NUMBER_FIXED")
        
        elif field.value_type == ValueType.FLOAT_FIXED:
            if field.fixed_value_float is None:
                errors.append("fixed_value_float is required for FLOAT_FIXED")
        
        elif field.value_type == ValueType.NUMBER_RANGE:
            if field.range_start_number is None or field.range_end_number is None:
                errors.append("range_start_number and range_end_number are required for NUMBER_RANGE")
            elif field.range_start_number > field.range_end_number:
                errors.append("range_start_number must be <= range_end_number")
        
        elif field.value_type == ValueType.FLOAT_RANGE:
            if field.range_start_float is None or field.range_end_float is None:
                errors.append("range_start_float and range_end_float are required for FLOAT_RANGE")
            elif field.range_start_float > field.range_end_float:
                errors.append("range_start_float must be <= range_end_float")
        
        elif field.value_type in [ValueType.INCREMENT, ValueType.DECREMENT]:
            if any(x is None for x in [field.start_number, field.step_number, field.reset_number]):
                errors.append("start_number, step_number, and reset_number are required for INCREMENT/DECREMENT")
            elif field.step_number <= 0:
                errors.append("step_number must be > 0")
        
        return errors
