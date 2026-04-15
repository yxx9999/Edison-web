# AGENTS.md

what:Project level Agents rules. Must be strictly adhered to every time when it is run


## Principle
Build and maintain this project according to the following principles:
- Always think and plan based on the goal first. If anything is unclear, ask before taking action.
- Use clear task routing and role separation.
- Keep changes minimal and tightly scoped.
- Verification is mandatory before completion.
- After any correction, explicitly record the lesson learned.


## Goal 
Read the current goal from  the `tasks/goal.md`before planning or execution.


## Multi-Agent orchestration
Use the `multi-agent-orchestration` skill for complex tasks.

A task should trigger `multi-agent-orchestration` if it:
- has 3 or more meaningful steps
- requires planning before coding
- spans multiple modules or files
- includes architectural or structural decisions
- needs independent review before completion

When this skill is used:
- agents.planner should create the plan first
- agents.coder should execute scoped subtasks
- agents.reviewer should validate before completion


## Hard Restrictions

### Never Do
- Do not bypass sandbox or approval controls.
- Do not modify files outside the scoped task boundary.
- Do not delete, replace, or rewrite core modules by default.
- Do not expose or alter secrets, tokens, credentials, or env files.
- Do not install dependencies or change configuration silently.
- Do not run destructive Git, database, or system commands.
- Do not refactor unrelated code.

### Approval Required
The following actions require my explicit approval before execution:
- dependency changes
- configuration changes
- database schema or migration changes
- deletion or replacement of important modules
- destructive or irreversible commands
- architecture-level changes
- network access that is not strictly necessary


## Feedback Layers

1. Process feedback goes to `tasks/todo.md` after my confirmation
   - task status
   - blockers
   - next step
   - scope changes

2. Review feedback is owned by `agents.reviewer`
   - correctness
   - verification status
   - risk
   - test gaps
   - elegance / maintainability concerns

3. Learning feedback goes to `tasks/lessons.md`
   - repeated mistakes
   - corrective rules
   - reusable lessons


## Planning Rules 
 For non-trivial tasks: 
 - Understand the objective first. ​      
 - Identify the relevant files and dependencies. ​      
 - Define constraints and acceptance criteria. ​      
 - Provide a brief but concrete plan before editing code. ​      
 
 For complex tasks, do not jump directly into implementation. 

 ​ ​   
## Execution Rules 
 - Prefer the smallest possible change. ​      
 - Modify only the files that are directly relevant to the current task. ​ - Do not install dependencies or change configuration without first    explaining why. ​      
 - Do not refactor unrelated code. ​      
 - If context is missing or task boundaries change, return the task to the planning stage instead of expanding scope on your own. ​   

 ​ ​   
## Verification Rules 
 A task must never be marked as complete before it has been verified. 
 Default verification includes: 

 - Run relevant tests when available. ​      
 - Check logs and runtime output when relevant. ​      
 - Verify that key behaviors match expectations. ​      
 - When relevant, compare the behavior of the current changes against the `main` branch. ​ 

 A task is complete only when it has been proven to work. 


## Lessons Rules 
 Whenever the user makes a correction: 
 - Immediately update `tasks/lessons.md`. ​      
 - Write down an actionable rule to prevent the same mistake from happening again. ​      
 - Check relevant lessons first when handling similar tasks in the future. ​      
 - Results matter more than activity.


## Core Rules
 • Simplicity first
 • Plan before execution
 • One task line per coder
 • Independent review
 • Minimal impact
 • Results over activity


- Created on 2026-04-14
- Ready for project-specific agent rules
