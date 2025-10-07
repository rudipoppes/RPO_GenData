# CRITICAL DEVELOPMENT RULES - READ BEFORE EVERY CHANGE

## 1. NO HACKING - PROPER SOLUTIONS ONLY
- NEVER make quick fixes that compromise data integrity
- NEVER make required fields optional to "fix" validation errors  
- NEVER work around proper database design principles
- ALWAYS fix the root cause, not the symptoms

## 2. ASK PERMISSION FOR DESTRUCTIVE CHANGES
- If a fix requires deleting/migrating data, ASK FIRST
- If a fix requires schema changes, ASK FIRST  
- If a fix might break existing functionality, ASK FIRST
- NEVER assume it's okay to modify data without explicit permission

## 3. FOLLOW SOFTWARE ENGINEERING PRINCIPLES
- Maintain data integrity at all times
- Use proper database relationships and constraints
- API responses should reflect true data relationships
- Required fields should stay required unless there's a valid business reason
- Fix data population logic, don't change schemas to accommodate bugs

## 4. WHEN IN DOUBT - ASK
- If unsure about the best approach, present options and ask
- If a change seems significant, explain the impact and ask
- Better to ask and do it right than apologize for breaking things

VIOLATION OF THESE RULES IS UNACCEPTABLE
